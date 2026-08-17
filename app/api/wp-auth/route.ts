// =============================================================================
// API ROUTE: /api/wp-auth — Autenticación WordPress → Blueshot Portal
// =============================================================================
// FLUJO:
// 1. Plugin WordPress envía un JWT firmado con WP_INTEGRATION_SECRET
// 2. Este endpoint verifica el JWT
// 3. Crea o recupera el usuario en Supabase Auth
// 4. Crea o actualiza el perfil en clients
// 5. Devuelve una URL de redirección con sesión activa
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyWordPressToken } from '@/lib/auth/wordpress'
import { createServiceClient } from '@/lib/supabase/server'

const RequestSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  redirect: z.string().default('/dashboard'),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const parsed = RequestSchema.safeParse({
      token: searchParams.get('token'),
      redirect: searchParams.get('redirect') ?? '/dashboard',
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { token, redirect } = parsed.data

    // Verificar el JWT de WordPress
    const wpPayload = await verifyWordPressToken(token)

    const serviceClient = createServiceClient()

    // Buscar o crear usuario en Supabase Auth
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find((u) => u.email === wpPayload.email)

    let authUserId: string

    if (existingUser) {
      authUserId = existingUser.id
    } else {
      // Crear usuario en Supabase Auth con email verificado
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email: wpPayload.email,
        email_confirm: true,
        user_metadata: {
          name: wpPayload.name,
          wordpress_user_id: wpPayload.wp_user_id,
          source: 'wordpress',
        },
      })

      if (createError || !newUser.user) {
        console.error('[WP Auth] Error creando usuario:', createError?.message)
        return NextResponse.json(
          { error: 'Error interno al crear usuario' },
          { status: 500 }
        )
      }

      authUserId = newUser.user.id
    }

    // Crear o actualizar el perfil del cliente
    const { data: existingClient } = await serviceClient
      .from('clients')
      .select('id')
      .eq('email', wpPayload.email)
      .single()

    if (!existingClient) {
      await serviceClient.from('clients').insert({
        auth_user_id: authUserId,
        wordpress_user_id: wpPayload.wp_user_id,
        email: wpPayload.email,
        name: wpPayload.name,
        active: true,
      })

      // Crear configuración por defecto
      const { data: newClient } = await serviceClient
        .from('clients')
        .select('id')
        .eq('email', wpPayload.email)
        .single()

      if (newClient) {
        await serviceClient.from('client_settings').insert({
          client_id: newClient.id,
          language: 'es',
        })
      }
    } else {
      // Actualizar auth_user_id si no estaba vinculado
      await serviceClient
        .from('clients')
        .update({ auth_user_id: authUserId, wordpress_user_id: wpPayload.wp_user_id })
        .eq('email', wpPayload.email)
    }

    // Generar magic link para autenticar automáticamente al usuario
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: 'magiclink',
      email: wpPayload.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}${redirect}`,
      },
    })

    if (linkError || !linkData) {
      console.error('[WP Auth] Error generando link:', linkError?.message)
      return NextResponse.json(
        { error: 'Error generando enlace de acceso' },
        { status: 500 }
      )
    }

    return NextResponse.redirect(linkData.properties.action_link)
  } catch (error) {
    if (error instanceof Error && error.message.includes('JWTExpired')) {
      return NextResponse.json(
        { error: 'Token expirado. Solicita un nuevo enlace desde WordPress.' },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message.includes('JWTInvalid')) {
      return NextResponse.json(
        { error: 'Token inválido.' },
        { status: 401 }
      )
    }

    console.error('[WP Auth] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
