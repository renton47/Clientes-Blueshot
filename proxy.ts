// =============================================================================
// PROXY — Next.js 16 (reemplaza middleware.ts)
// Refresca la sesión de Supabase y protege rutas autenticadas
// =============================================================================

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
