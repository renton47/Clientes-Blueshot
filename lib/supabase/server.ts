import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// Tipo de cliente de servidor con Database tipado
export type TypedSupabaseServerClient = ReturnType<typeof createSupabaseServerClient<Database>>
export type TypedSupabaseAdminClient = ReturnType<typeof createSupabaseClient<Database>>

/**
 * Cliente de servidor que respeta RLS.
 * Usar para operaciones de usuario autenticado.
 */
export async function createServerClient(): Promise<TypedSupabaseServerClient> {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component: no se pueden setear cookies. OK ignorar.
          }
        },
      },
    }
  )
}

/**
 * Cliente administrativo con service_role.
 * SOLO para API Routes del servidor.
 * NUNCA exponer al cliente.
 */
export function createServiceClient(): TypedSupabaseAdminClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase service role credentials are not configured')
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
