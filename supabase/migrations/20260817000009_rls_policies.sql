-- =============================================================================
-- MIGRACIÓN 009: ROW LEVEL SECURITY (RLS)
-- Políticas de seguridad — CRÍTICO: cada cliente solo ve sus propios datos
-- =============================================================================

-- =============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =============================================================================

ALTER TABLE public.clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources          ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- FUNCIÓN HELPER: obtiene el client_id del usuario autenticado
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_current_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clients WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_current_client_id() IS 
  'Retorna el client_id del usuario autenticado. Usar en políticas RLS.';

-- =============================================================================
-- POLÍTICAS: CLIENTS
-- El cliente puede ver y actualizar solo su propio perfil
-- =============================================================================

CREATE POLICY "clients_select_own"
  ON public.clients FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "clients_update_own"
  ON public.clients FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Solo el service_role puede insertar/eliminar clientes (via backend admin)
-- No se crea política INSERT/DELETE para usuarios normales

-- =============================================================================
-- POLÍTICAS: CLIENT_SETTINGS
-- =============================================================================

CREATE POLICY "client_settings_select_own"
  ON public.client_settings FOR SELECT
  USING (client_id = public.get_current_client_id());

CREATE POLICY "client_settings_update_own"
  ON public.client_settings FOR UPDATE
  USING (client_id = public.get_current_client_id())
  WITH CHECK (client_id = public.get_current_client_id());

-- =============================================================================
-- POLÍTICAS: CONVERSATIONS
-- El cliente puede gestionar solo sus propias conversaciones
-- =============================================================================

CREATE POLICY "conversations_select_own"
  ON public.conversations FOR SELECT
  USING (client_id = public.get_current_client_id());

CREATE POLICY "conversations_insert_own"
  ON public.conversations FOR INSERT
  WITH CHECK (client_id = public.get_current_client_id());

CREATE POLICY "conversations_update_own"
  ON public.conversations FOR UPDATE
  USING (client_id = public.get_current_client_id())
  WITH CHECK (client_id = public.get_current_client_id());

CREATE POLICY "conversations_delete_own"
  ON public.conversations FOR DELETE
  USING (client_id = public.get_current_client_id());

-- =============================================================================
-- POLÍTICAS: MESSAGES
-- Solo puede ver mensajes de sus propias conversaciones
-- =============================================================================

CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE client_id = public.get_current_client_id()
    )
  );

CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE client_id = public.get_current_client_id()
    )
  );

-- Los mensajes no se editan — solo se eliminan con la conversación (CASCADE)

-- =============================================================================
-- POLÍTICAS: AI_USAGE
-- Solo lectura del propio uso (sin insert desde cliente — lo hace el server)
-- =============================================================================

CREATE POLICY "ai_usage_select_own"
  ON public.ai_usage FOR SELECT
  USING (client_id = public.get_current_client_id());

-- INSERT solo via service_role (API Route del servidor)

-- =============================================================================
-- POLÍTICAS: AI_TOOLS
-- Todos los clientes autenticados pueden leer las herramientas disponibles
-- =============================================================================

CREATE POLICY "ai_tools_select_all_authenticated"
  ON public.ai_tools FOR SELECT
  USING (auth.role() = 'authenticated' AND active = TRUE);

-- =============================================================================
-- POLÍTICAS: KNOWLEDGE_DOCUMENTS
-- Puede ver: documentos globales + documentos propios
-- NO puede ver: documentos de otros clientes
-- =============================================================================

CREATE POLICY "knowledge_docs_select_global"
  ON public.knowledge_documents FOR SELECT
  USING (document_type = 'global');

CREATE POLICY "knowledge_docs_select_own_client"
  ON public.knowledge_documents FOR SELECT
  USING (
    document_type = 'client'
    AND client_id = public.get_current_client_id()
  );

-- =============================================================================
-- POLÍTICAS: KNOWLEDGE_CHUNKS
-- Hereda permisos del documento padre
-- =============================================================================

CREATE POLICY "knowledge_chunks_select_global"
  ON public.knowledge_chunks FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.knowledge_documents WHERE document_type = 'global'
    )
  );

CREATE POLICY "knowledge_chunks_select_own_client"
  ON public.knowledge_chunks FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.knowledge_documents
      WHERE document_type = 'client'
        AND client_id = public.get_current_client_id()
    )
  );

-- =============================================================================
-- POLÍTICAS: RESOURCES
-- Puede ver recursos según su scope
-- =============================================================================

-- Recursos disponibles para todos los clientes autenticados
CREATE POLICY "resources_select_all_scope"
  ON public.resources FOR SELECT
  USING (
    active = TRUE
    AND scope = 'all'
    AND auth.role() = 'authenticated'
  );

-- Recursos específicos del cliente
CREATE POLICY "resources_select_client_scope"
  ON public.resources FOR SELECT
  USING (
    active = TRUE
    AND scope = 'client'
    AND client_id = public.get_current_client_id()
  );

-- Recursos de grupo (para el MVP: cualquier cliente autenticado activo)
-- En el futuro se puede refinar con una tabla client_groups
CREATE POLICY "resources_select_group_scope"
  ON public.resources FOR SELECT
  USING (
    active = TRUE
    AND scope = 'group'
    AND auth.role() = 'authenticated'
  );

-- =============================================================================
-- VERIFICACIÓN FINAL: todas las tablas tienen RLS habilitado
-- =============================================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'clients', 'client_settings', 'conversations', 'messages',
    'ai_usage', 'ai_tools', 'knowledge_documents', 'knowledge_chunks', 'resources'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = tbl
    ) THEN
      RAISE EXCEPTION 'TABLA NO ENCONTRADA: %. Verifica que las migraciones anteriores se ejecutaron.', tbl;
    END IF;
  END LOOP;
  RAISE NOTICE 'RLS verificado en todas las tablas correctamente.';
END $$;
