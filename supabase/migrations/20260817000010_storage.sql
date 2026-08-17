-- =============================================================================
-- MIGRACIÓN 010: STORAGE Y BUCKETS
-- Creación del bucket para recursos privados y políticas de seguridad
-- =============================================================================

-- 1. Crear el bucket privado (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-resources',
  'client-resources',
  false,
  524288000, -- 500MB límite
  null
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 524288000;

-- 2. Habilitar RLS en objetos de storage (por seguridad, aunque usamos Signed URLs)
-- Las Signed URLs creadas con service_role bypassean el RLS por diseño.
-- Sin embargo, es buena práctica tener políticas restrictivas base.

-- Nadie puede leer los objetos directamente sin URL firmada
CREATE POLICY "Deny all public access to client-resources"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-resources' AND false);

-- Solo service_role puede insertar/actualizar (usado desde backend/dashboard)
CREATE POLICY "Service role can insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-resources' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'client-resources' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'client-resources' AND auth.role() = 'service_role');
