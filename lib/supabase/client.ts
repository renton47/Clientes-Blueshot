// =============================================================================
// SUPABASE CLIENT — Para uso en componentes del lado del navegador
// =============================================================================
// SEGURIDAD: Este cliente usa la anon key (pública) y respeta RLS.
// Nunca usa la service_role key.
// =============================================================================

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
