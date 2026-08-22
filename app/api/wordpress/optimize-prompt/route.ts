import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 });
    }
    const supabase = createServiceClient();

    const { data: installation, error } = await supabase
      .from('wordpress_installations')
      .select('client_id, active, clients(name, company_name, active)')
      .eq('token', token)
      .eq('active', true)
      .single();

    if (error || !installation) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const client = Array.isArray(installation.clients) ? installation.clients[0] : installation.clients;
    if (!client?.active) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, model_preference } = body;

    if (!prompt) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    const providerName = model_preference === 'gemini' ? 'gemini' : 'openai';
    const provider = getAIProvider(providerName);

    const systemPrompt = `Eres un experto en ingeniería de prompts para modelos de generación de imágenes (como Midjourney o Imagen 3).
Tu tarea es leer una idea inicial del usuario y convertirla en un prompt profesional, detallado y altamente descriptivo, manteniendo estrictamente la intención original.
Agrega detalles sobre iluminación, estilo artístico (fotorrealista, cinematográfico, etc.), encuadre y atmósfera si están ausentes, pero no cambies el sujeto ni la acción principal.
Responde ÚNICAMENTE con el prompt optimizado, sin introducciones ni comentarios adicionales.`;

    const result = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      data: { optimized_prompt: result.content.trim() } 
    });
  } catch (error: any) {
    console.error(error);
    const errorMessage = error?.message || 'Internal Server Error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
