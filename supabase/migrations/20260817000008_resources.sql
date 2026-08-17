-- =============================================================================
-- MIGRACIÓN 008: TABLA RESOURCES
-- Recursos privados (ZIPs) para clientes
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.resource_type AS ENUM ('zip', 'guide', 'document', 'video');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_scope AS ENUM ('all', 'client', 'group');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.resources (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  -- Ruta en Supabase Storage bucket 'client-resources'
  file_path      TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  file_size      BIGINT,
  resource_type  public.resource_type NOT NULL DEFAULT 'zip',
  -- all: todos los clientes | client: solo un cliente | group: por etiqueta
  scope          public.resource_scope NOT NULL DEFAULT 'all',
  -- Solo usado cuando scope = 'client'
  client_id      UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  -- Etiqueta de grupo (ej: 'plan_premium', 'ecommerce', etc.)
  group_tag      TEXT,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_scope ON public.resources(scope);
CREATE INDEX IF NOT EXISTS idx_resources_client_id ON public.resources(client_id);
CREATE INDEX IF NOT EXISTS idx_resources_active ON public.resources(active);
CREATE INDEX IF NOT EXISTS idx_resources_sort ON public.resources(sort_order ASC);

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.resources IS 'Recursos privados para clientes: ZIPs mensuales, guías, documentos';
COMMENT ON COLUMN public.resources.file_path IS 'Ruta en Supabase Storage bucket client-resources (nunca URL pública)';
COMMENT ON COLUMN public.resources.scope IS 'all=todos, client=cliente específico, group=por etiqueta';
