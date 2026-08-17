-- =============================================================================
-- MIGRACIÓN 006: TABLA AI_USAGE
-- Registro de uso de IA por cliente (control, billing, analytics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  conversation_id     UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  tool_id             UUID REFERENCES public.ai_tools(id) ON DELETE SET NULL,
  model               TEXT NOT NULL,
  prompt_tokens       INTEGER NOT NULL DEFAULT 0,
  completion_tokens   INTEGER NOT NULL DEFAULT 0,
  total_tokens        INTEGER NOT NULL DEFAULT 0,
  -- Costo estimado en USD según tarifas del modelo
  estimated_cost_usd  NUMERIC(10, 6),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_client_id ON public.ai_usage(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tool_id ON public.ai_usage(tool_id);

-- Vista de uso mensual por cliente (útil para dashboard admin)
CREATE OR REPLACE VIEW public.ai_usage_monthly AS
SELECT
  client_id,
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_requests,
  SUM(total_tokens) AS total_tokens,
  SUM(prompt_tokens) AS total_prompt_tokens,
  SUM(completion_tokens) AS total_completion_tokens,
  SUM(estimated_cost_usd) AS total_cost_usd
FROM public.ai_usage
GROUP BY client_id, DATE_TRUNC('month', created_at);

COMMENT ON TABLE public.ai_usage IS 'Registro de uso de IA por cliente para control de límites y analytics';
COMMENT ON VIEW public.ai_usage_monthly IS 'Vista agregada de uso mensual por cliente';
