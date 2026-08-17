-- Creación de la tabla de instalaciones WordPress de clientes

CREATE TABLE public.wordpress_installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.wordpress_installations ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (Solo service_role o lectura por usuarios del mismo cliente)
CREATE POLICY "Usuarios autenticados pueden ver las instalaciones de su empresa"
ON public.wordpress_installations FOR SELECT
TO authenticated
USING (client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_wordpress_installations_modtime
BEFORE UPDATE ON public.wordpress_installations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Índices
CREATE INDEX idx_wordpress_installations_client_id ON public.wordpress_installations(client_id);
CREATE INDEX idx_wordpress_installations_token ON public.wordpress_installations(token);
