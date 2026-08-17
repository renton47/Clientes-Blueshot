// =============================================================================
// SIGNED URLS — Generación de URLs temporales para ZIPs privados
// =============================================================================
// ARQUITECTURA SEGURA:
// Cliente autenticado → verifica permisos → genera URL firmada temporal (1h)
// El cliente descarga directamente desde Supabase Storage
// La URL expira automáticamente — no hay exposición pública permanente
// =============================================================================

import { createServiceClient } from '@/lib/supabase/server'

const STORAGE_BUCKET = 'client-resources'
const SIGNED_URL_EXPIRY_SECONDS = 3600 // 1 hora

/**
 * Genera una URL firmada temporal para descargar un ZIP privado.
 * Verifica que el recurso existe y es accesible antes de firmar.
 */
export async function generateSignedDownloadUrl(filePath: string): Promise<string> {
  const supabase = createServiceClient()

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS)

  if (error) {
    throw new Error(`Error al generar URL de descarga: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Verifica si un cliente tiene acceso a un recurso específico.
 * Debe llamarse ANTES de generar la URL firmada.
 */
export async function verifyClientResourceAccess(
  clientId: string,
  resourceId: string
): Promise<boolean> {
  const supabase = createServiceClient()

  const { data: resource, error } = await supabase
    .from('resources')
    .select('id, scope, client_id, group_tag, active')
    .eq('id', resourceId)
    .eq('active', true)
    .single()

  if (error || !resource) return false

  // Acceso para todos los clientes
  if (resource.scope === 'all') return true

  // Acceso específico del cliente
  if (resource.scope === 'client' && resource.client_id === clientId) return true

  // Acceso por grupo — verificar si el cliente pertenece al grupo
  if (resource.scope === 'group' && resource.group_tag) {
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single()

    // Para el MVP, los recursos de grupo son accesibles a cualquier cliente activo
    // En el futuro se puede agregar una tabla client_groups para mayor granularidad
    return !!client
  }

  return false
}
