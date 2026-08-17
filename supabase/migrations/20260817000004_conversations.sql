-- =============================================================================
-- MIGRACIÓN 004: TABLA CONVERSATIONS
-- Conversaciones del cliente con Blueshot AI
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Nueva conversación',
  -- Herramienta usada en esta conversación (referencia opcional)
  tool_id     UUID REFERENCES public.ai_tools(id) ON DELETE SET NULL,
  archived    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_archived ON public.conversations(archived);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.conversations IS 'Conversaciones de clientes con Blueshot AI';
COMMENT ON COLUMN public.conversations.tool_id IS 'Herramienta de IA usada en esta conversación';
