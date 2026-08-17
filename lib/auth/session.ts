// =============================================================================
// AUTH SESSION — Obtiene sesión y perfil del cliente desde el servidor
// =============================================================================

import { createServerClient } from '@/lib/supabase/server'
import type { AuthSession } from '@/types/portal'

/**
 * Obtiene la sesión autenticada actual junto con el perfil del cliente.
 * Usar en Server Components y API Routes.
 * Retorna null si no hay sesión válida.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return null

  // Buscar el perfil del cliente en nuestra tabla clients
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email!)
    .single()

  if (clientError || !client) {
    // El usuario existe en Supabase Auth pero no tiene perfil de cliente
    // Esto puede ocurrir en el primer login (se crea el perfil luego)
    return null
  }

  // Obtener configuración del cliente
  const { data: settings } = await supabase
    .from('client_settings')
    .select('*')
    .eq('client_id', client.id)
    .single()

  return {
    userId: user.id,
    email: user.email!,
    client,
    settings: settings ?? null,
  }
}

/**
 * Obtiene solo la sesión de Supabase Auth sin datos de perfil.
 * Más rápida para verificaciones simples de autenticación.
 */
export async function getSessionUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}
