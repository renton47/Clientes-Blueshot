import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';
export const maxDuration = 300;

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
    const { post, seo_context, model_preference } = body;
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post data required' }, { status: 400 });
    }

    const providerName = model_preference === 'gemini' ? 'gemini' : 'openai';
    const provider = getAIProvider(providerName);

    const systemPrompt = `Eres un experto en SEO especializado en WordPress. Analiza el siguiente contenido de una página/entrada.
Responde ÚNICAMENTE en JSON con la siguiente estructura y nada más:
{
  "seo_title": "Título SEO Optimizado (Max 60 chars)",
  "meta_description": "Meta descripción optimizada (Max 160 chars)",
  "focus_keyword": "Palabra clave principal"
}
Si se te provee el contexto SEO actual (seo_context), intenta mejorarlo en lugar de ignorarlo.`;

    const userPrompt = `Datos del Post:
${JSON.stringify(post, null, 2)}
Contexto SEO Actual:
${seo_context ? JSON.stringify(seo_context, null, 2) : 'Ninguno'}`;

    const response = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    try {
      let jsonStr = response.content;
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json({ success: true, data: parsed });
    } catch (error) {
      console.error('Failed to parse AI response:', response.content);
      return NextResponse.json({ success: false, error: 'Invalid AI response' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
