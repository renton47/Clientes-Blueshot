-- =============================================================================
-- MIGRACIÓN 001: TABLA CLIENTS
-- Perfiles de clientes de Blueshot
-- =============================================================================

-- Habilitar extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.clients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Referencia al usuario en Supabase Auth (auth.users)
  auth_user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- ID del usuario en WordPress (para integración)
  wordpress_user_id   INTEGER UNIQUE,
  email               TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  company_name        TEXT,
  website_url         TEXT,
  -- Plataforma e-commerce: woocommerce, shopify, tiendanube, magento, etc.
  ecommerce_platform  TEXT,
  industry            TEXT,
  country             TEXT DEFAULT 'Chile',
  tone_of_voice       TEXT DEFAULT 'profesional',
  brand_description   TEXT,
  active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON public.clients(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_wordpress_user_id ON public.clients(wordpress_user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.clients IS 'Perfiles de clientes de Blueshot — fuente de verdad de datos de negocio';
COMMENT ON COLUMN public.clients.auth_user_id IS 'Referencia a auth.users de Supabase';
COMMENT ON COLUMN public.clients.wordpress_user_id IS 'ID del usuario en WordPress para integración';
