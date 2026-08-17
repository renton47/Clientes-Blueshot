// =============================================================================
// WORDPRESS AUTH — Integración segura WordPress → Portal
// =============================================================================
// FLUJO:
// 1. WordPress genera un JWT firmado con WP_INTEGRATION_SECRET
// 2. El portal recibe el token en /api/wp-auth
// 3. El portal valida el JWT y crea/autentica al usuario en Supabase Auth
// 4. El cliente queda autenticado sin necesidad de una segunda cuenta
// =============================================================================

import { SignJWT, jwtVerify } from 'jose'
import type { WPAuthTokenPayload } from '@/types/portal'

const WP_INTEGRATION_SECRET = new TextEncoder().encode(
  process.env.WP_INTEGRATION_SECRET ?? ''
)

/**
 * Verifica un JWT generado por el plugin WordPress.
 * Lanza un error si el token es inválido o expirado.
 */
export async function verifyWordPressToken(token: string): Promise<WPAuthTokenPayload> {
  if (!process.env.WP_INTEGRATION_SECRET) {
    throw new Error('WP_INTEGRATION_SECRET no está configurado')
  }

  const { payload } = await jwtVerify(token, WP_INTEGRATION_SECRET, {
    algorithms: ['HS256'],
  })

  if (
    typeof payload.wp_user_id !== 'number' ||
    typeof payload.email !== 'string' ||
    typeof payload.name !== 'string'
  ) {
    throw new Error('Token WordPress inválido: payload incompleto')
  }

  return {
    wp_user_id: payload.wp_user_id,
    email: payload.email,
    name: payload.name,
    iat: payload.iat as number,
    exp: payload.exp as number,
  }
}

/**
 * Genera un JWT de integración WordPress.
 * Solo para uso en tests y el plugin WordPress (PHP lo hace en producción).
 */
export async function generateWordPressToken(
  wpUserId: number,
  email: string,
  name: string
): Promise<string> {
  if (!process.env.WP_INTEGRATION_SECRET) {
    throw new Error('WP_INTEGRATION_SECRET no está configurado')
  }

  return new SignJWT({ wp_user_id: wpUserId, email, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m') // Token de corta duración para máxima seguridad
    .sign(WP_INTEGRATION_SECRET)
}
