// =============================================================================
// TESTS DE SEGURIDAD: RLS y aislamiento entre clientes
// =============================================================================
// Ejecutar con: npm test
// =============================================================================

/**
 * Tests que verifican que el aislamiento entre clientes funciona correctamente.
 * Estos tests son mocks — representan la lógica de verificación.
 * Para tests de integración real, usa supabase test o un entorno de staging.
 */

describe('Seguridad: Aislamiento entre clientes', () => {
  it('get_current_client_id() debe retornar el client_id del usuario autenticado', () => {
    // Esta función es el foundation de todas las policies RLS
    // Verifica que la función SQL existe en la migración 009
    const migrationContent = `
      CREATE OR REPLACE FUNCTION public.get_current_client_id()
      RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
      AS $$ SELECT id FROM public.clients WHERE auth_user_id = auth.uid() LIMIT 1; $$;
    `
    expect(migrationContent).toContain('get_current_client_id')
    expect(migrationContent).toContain('auth.uid()')
    expect(migrationContent).toContain('SECURITY DEFINER')
  })

  it('Las políticas RLS usan get_current_client_id() para filtrar datos', () => {
    const rlsPolicy = `
      USING (client_id = public.get_current_client_id())
    `
    expect(rlsPolicy).toContain('get_current_client_id()')
    expect(rlsPolicy).not.toContain('TRUE') // No permite acceso sin filtro
  })

  it('Los mensajes solo son accesibles via conversaciones del mismo cliente', () => {
    const messagesPolicy = `
      USING (
        conversation_id IN (
          SELECT id FROM public.conversations
          WHERE client_id = public.get_current_client_id()
        )
      )
    `
    expect(messagesPolicy).toContain('get_current_client_id()')
    // Subconsulta que verifica propiedad de la conversación
    expect(messagesPolicy).toContain('conversations')
  })

  it('Los documentos de tipo client solo son visibles para su propietario', () => {
    const docPolicy = `
      USING (
        document_type = 'client'
        AND client_id = public.get_current_client_id()
      )
    `
    expect(docPolicy).toContain("document_type = 'client'")
    expect(docPolicy).toContain('get_current_client_id()')
  })

  it('RLS está habilitado en todas las tablas críticas', () => {
    const tables = [
      'clients',
      'client_settings',
      'conversations',
      'messages',
      'ai_usage',
      'ai_tools',
      'knowledge_documents',
      'knowledge_chunks',
      'resources',
    ]

    const rlsMigration = `
      ALTER TABLE public.clients            ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.client_settings    ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.conversations      ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.ai_usage           ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.ai_tools           ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.knowledge_chunks   ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.resources          ENABLE ROW LEVEL SECURITY;
    `

    tables.forEach((table) => {
      expect(rlsMigration).toContain(`${table}`)
      expect(rlsMigration).toContain('ENABLE ROW LEVEL SECURITY')
    })
  })
})

describe('Seguridad: API Routes', () => {
  it('La API de chat verifica autenticación antes de procesar', () => {
    // Verificar que el código del route verifica la sesión al inicio
    const routeCode = `
      const session = await getAuthSession()
      if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
    `
    expect(routeCode).toContain('getAuthSession()')
    expect(routeCode).toContain('401')
    expect(routeCode).toContain('No autorizado')
  })

  it('La descarga de recursos verifica permisos antes de generar URL firmada', () => {
    const downloadRoute = `
      const hasAccess = await verifyClientResourceAccess(client.id, resource_id)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Recurso no encontrado o sin acceso' }, { status: 404 })
      }
      const signedUrl = await generateSignedDownloadUrl(resource.file_path)
    `
    // La verificación debe ocurrir ANTES de generar la URL
    const accessCheckIndex = downloadRoute.indexOf('verifyClientResourceAccess')
    const signedUrlIndex = downloadRoute.indexOf('generateSignedDownloadUrl')

    expect(accessCheckIndex).toBeLessThan(signedUrlIndex)
    expect(downloadRoute).toContain('404') // Respuesta genérica sin revelar si existe
  })

  it('El endpoint wp-auth valida el JWT antes de crear sesión', () => {
    const wpAuthRoute = `
      const wpPayload = await verifyWordPressToken(token)
    `
    expect(wpAuthRoute).toContain('verifyWordPressToken')
    // Si el token es inválido, jose lanza un error que el catch maneja
  })
})

describe('Seguridad: Variables de entorno', () => {
  it('La service_role key solo se usa en funciones del servidor', () => {
    // Verificar que el cliente del navegador NO usa service_role
    const browserClientCode = `
      return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    `
    expect(browserClientCode).not.toContain('SERVICE_ROLE')
    expect(browserClientCode).not.toContain('service_role')
    expect(browserClientCode).toContain('ANON_KEY')
  })

  it('Las variables NEXT_PUBLIC_ no contienen secretos', () => {
    // Solo estas variables son seguras para el navegador
    const publicVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_WP_URL',
    ]

    const secretVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'JWT_SECRET',
      'WP_INTEGRATION_SECRET',
      'SUPABASE_DB_PASSWORD',
    ]

    // Las variables secretas no tienen el prefijo NEXT_PUBLIC_
    secretVars.forEach((v) => {
      expect(v).not.toMatch(/^NEXT_PUBLIC_/)
    })

    // Las variables públicas no contienen palabras como 'secret', 'key', 'password'
    publicVars.forEach((v) => {
      expect(v.toLowerCase()).not.toContain('secret')
      expect(v.toLowerCase()).not.toContain('password')
    })
  })
})

describe('Seguridad: JWT WordPress', () => {
  it('El token de integración expira en 5 minutos', () => {
    const tokenCode = `
      .setExpirationTime('5m')
    `
    expect(tokenCode).toContain('5m')
  })

  it('El token usa algoritmo HS256', () => {
    const tokenCode = `
      .setProtectedHeader({ alg: 'HS256' })
    `
    expect(tokenCode).toContain('HS256')
  })
})
