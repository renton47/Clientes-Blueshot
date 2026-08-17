-- =============================================================================
-- MIGRACIÓN 003: TABLA AI_TOOLS
-- Herramientas disponibles en Blueshot AI
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_tools (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL DEFAULT 'general',
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tools_slug ON public.ai_tools(slug);
CREATE INDEX IF NOT EXISTS idx_ai_tools_active ON public.ai_tools(active);

COMMENT ON TABLE public.ai_tools IS 'Catálogo de herramientas de IA disponibles en el portal';

-- Seed inicial de herramientas
INSERT INTO public.ai_tools (slug, name, description, category, sort_order) VALUES
  ('product_copy',       'Ficha de Producto',          'Genera nombre optimizado, descripción, meta title, meta description, slug, keywords y FAQ', 'producto', 1),
  ('seo_product',        'SEO de Producto',            'Analiza y genera contenido SEO: keywords, estructura, meta tags y recomendaciones',          'seo',      2),
  ('google_shopping',    'Google Shopping',            'Genera atributos optimizados para Google Merchant Center y campañas Shopping',               'shopping', 3),
  ('social_copy',        'Copy para Redes Sociales',   'Crea copy adaptado para Instagram, Facebook y LinkedIn',                                     'redes',    4),
  ('product_optimization','Optimización de Producto',  'Analiza una ficha existente, detecta problemas y entrega versión mejorada',                  'producto', 5)
ON CONFLICT (slug) DO NOTHING;
