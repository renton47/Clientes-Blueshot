-- =============================================================================
-- MIGRACIÓN 002: TABLA CLIENT_SETTINGS
-- Configuración específica por cliente
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.client_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                 UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  language                  TEXT NOT NULL DEFAULT 'es',
  tone                      TEXT DEFAULT 'profesional',
  country                   TEXT DEFAULT 'Chile',
  currency                  TEXT DEFAULT 'CLP',
  -- Preferencias SEO en JSON: {"focus_keywords": [], "avoid_keywords": [], ...}
  seo_preferences           JSONB DEFAULT '{}',
  communication_style       TEXT DEFAULT 'formal',
  additional_instructions   TEXT,
  -- Límites de uso mensual de IA
  monthly_ai_request_limit  INTEGER NOT NULL DEFAULT 500,
  monthly_token_limit       INTEGER NOT NULL DEFAULT 500000,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Un solo registro de configuración por cliente
  CONSTRAINT uq_client_settings_client UNIQUE (client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_settings_client_id ON public.client_settings(client_id);

CREATE TRIGGER client_settings_updated_at
  BEFORE UPDATE ON public.client_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.client_settings IS 'Configuración personalizada de cada cliente para Blueshot AI';
COMMENT ON COLUMN public.client_settings.seo_preferences IS 'JSONB con preferencias SEO: keywords foco, keywords a evitar, etc.';
COMMENT ON COLUMN public.client_settings.monthly_ai_request_limit IS 'Límite de solicitudes de IA por mes (control de uso)';
