// =============================================================================
// API ROUTE: /api/ai/chat — Endpoint principal de Blueshot AI
// =============================================================================
// SEGURIDAD:
// - Solo accesible para usuarios autenticados
// - La API key de OpenAI nunca sale del servidor
// - El uso se registra en ai_usage con service_role
// - Streaming via ReadableStream
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { getAIProvider } from '@/lib/ai/provider'
import { buildSystemPrompt } from '@/lib/ai/prompts/system'
import { buildProductCopyPrompt, buildOptimizationPrompt } from '@/lib/ai/prompts/product'
import { buildSEOPrompt } from '@/lib/ai/prompts/seo'
import { buildSocialCopyPrompt } from '@/lib/ai/prompts/social'
import { buildShoppingPrompt } from '@/lib/ai/prompts/shopping'
import { createServiceClient } from '@/lib/supabase/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  ChatInputSchema,
  ProductToolInputSchema,
  SEOToolInputSchema,
  SocialToolInputSchema,
  ShoppingToolInputSchema,
  OptimizationToolInputSchema,
} from '@/types/ai'
import type { ClientAIContext } from '@/types/ai'
import type { AIMessage } from '@/types/ai'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  // 1. Verificar autenticación
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Validar input
  const body = await request.json()
  const parsed = ChatInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const { message, conversation_id, tool_id, tool_input } = parsed.data
  const { client, settings } = session

  // 3. Construir contexto del cliente para la IA
  const clientContext: ClientAIContext = {
    clientId: client.id,
    companyName: client.company_name ?? undefined,
    industry: client.industry ?? undefined,
    websiteUrl: client.website_url ?? undefined,
    ecommercePlatform: client.ecommerce_platform ?? undefined,
    country: client.country ?? undefined,
    toneOfVoice: client.tone_of_voice ?? undefined,
    brandDescription: client.brand_description ?? undefined,
    language: settings?.language ?? 'es',
    additionalInstructions: settings?.additional_instructions ?? undefined,
  }

  const supabase = await createServerClient()

  // 4. Obtener o crear conversación
  let convId = conversation_id
  if (!convId) {
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        client_id: client.id,
        title: message.slice(0, 60),
      })
      .select('id')
      .single()

    if (convError || !newConv) {
      return NextResponse.json({ error: 'Error al crear conversación' }, { status: 500 })
    }
    convId = newConv.id
  }

  // 5. Obtener historial de mensajes de la conversación
  const { data: previousMessages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(20) // Ventana de contexto razonable

  // 6. Guardar mensaje del usuario
  await supabase.from('messages').insert({
    conversation_id: convId,
    role: 'user',
    content: message,
    metadata: tool_input ? ({ tool_id: tool_id ?? null, tool_input } as unknown as import('@/types/database').Json) : null,
  })

  // 7. Construir el prompt según la herramienta seleccionada
  let userPrompt = message

  if (tool_id && tool_input) {
    try {
      switch (tool_id) {
        case 'product_copy': {
          const input = ProductToolInputSchema.parse(tool_input)
          userPrompt = buildProductCopyPrompt(input)
          break
        }
        case 'seo_product': {
          const input = SEOToolInputSchema.parse(tool_input)
          userPrompt = buildSEOPrompt(input)
          break
        }
        case 'social_copy': {
          const input = SocialToolInputSchema.parse(tool_input)
          userPrompt = buildSocialCopyPrompt(input)
          break
        }
        case 'google_shopping': {
          const input = ShoppingToolInputSchema.parse(tool_input)
          userPrompt = buildShoppingPrompt(input)
          break
        }
        case 'product_optimization': {
          const input = OptimizationToolInputSchema.parse(tool_input)
          userPrompt = buildOptimizationPrompt(input)
          break
        }
      }
    } catch {
      return NextResponse.json(
        { error: 'Datos de herramienta inválidos' },
        { status: 400 }
      )
    }
  }

  // 8. Preparar mensajes para el LLM
  const systemPrompt = buildSystemPrompt(clientContext)
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(previousMessages?.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })) ?? []),
    { role: 'user', content: userPrompt },
  ]

  // 9. Llamar al LLM con streaming
  const provider = getAIProvider()

  const serviceClient = createServiceClient()
  let fullContent = ''
  let model = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Streaming del LLM
        for await (const chunk of provider.stream({ messages })) {
          fullContent += chunk
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ chunk })}\n\n`))
        }

        // Señal de fin de stream
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ done: true, conversation_id: convId })}\n\n`)
        )
        controller.close()

        // 10. Guardar respuesta del asistente y registrar uso (async, no bloquea el stream)
        model = process.env.OPENAI_MODEL ?? 'gpt-4o'

        await serviceClient.from('messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: fullContent,
          metadata: ({ model, tool_id: tool_id ?? null } as unknown as import('@/types/database').Json),
        })

        // Registro de uso aproximado (tokens estimados)
        const estimatedTokens = Math.ceil(fullContent.length / 4)
        await serviceClient.from('ai_usage').insert({
          client_id: client.id,
          conversation_id: convId ?? null,
          tool_id: tool_id ?? null,
          model,
          prompt_tokens: Math.ceil(userPrompt.length / 4),
          completion_tokens: estimatedTokens,
          total_tokens: Math.ceil(userPrompt.length / 4) + estimatedTokens,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error del servidor de IA'
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
