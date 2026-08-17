// =============================================================================
// API ROUTE: /api/resources/download — Descarga segura de ZIPs privados
// =============================================================================
// FLUJO SEGURO:
// 1. Cliente autenticado solicita descarga con resourceId
// 2. Verificamos permisos del cliente sobre ese recurso
// 3. Generamos URL firmada temporal (1 hora)
// 4. Devolvemos la URL al cliente (nunca expone file_path directamente)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthSession } from '@/lib/auth/session'
import { generateSignedDownloadUrl, verifyClientResourceAccess } from '@/lib/security/signed-urls'
import { createServerClient } from '@/lib/supabase/server'

const RequestSchema = z.object({
  resource_id: z.string().uuid('ID de recurso inválido'),
})

export async function POST(request: NextRequest) {
  // 1. Verificar autenticación
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Validar input
  const body = await request.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const { resource_id } = parsed.data
  const { client } = session

  // 3. Verificar permisos (CRÍTICO — antes de generar cualquier URL)
  const hasAccess = await verifyClientResourceAccess(client.id, resource_id)
  if (!hasAccess) {
    // Respuesta genérica para no revelar si el recurso existe
    return NextResponse.json(
      { error: 'Recurso no encontrado o sin acceso' },
      { status: 404 }
    )
  }

  // 4. Obtener metadata del recurso
  const supabase = await createServerClient()
  const { data: resource, error: resourceError } = await supabase
    .from('resources')
    .select('file_path, file_name, resource_type')
    .eq('id', resource_id)
    .single()

  if (resourceError || !resource) {
    return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
  }

  // 5. Generar URL firmada temporal
  try {
    const signedUrl = await generateSignedDownloadUrl(resource.file_path)
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

    return NextResponse.json({
      signed_url: signedUrl,
      file_name: resource.file_name,
      expires_at: expiresAt,
    })
  } catch (error) {
    console.error('[Resource Download] Error:', error)
    return NextResponse.json(
      { error: 'Error al generar enlace de descarga' },
      { status: 500 }
    )
  }
}
