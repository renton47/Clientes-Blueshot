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
    const { site_name, site_description, content_sample, model_preference } = body;

    const providerName = model_preference === 'gemini' ? 'gemini' : 'openai';
    const provider = getAIProvider(providerName);

    const systemPrompt = `Eres un experto en clasificación de negocios. Dado el nombre, descripción y un extracto de contenido de un sitio web, determina el "Nicho" principal de este negocio de forma concisa.
Responde ÚNICAMENTE con 1 o 2 palabras (ejemplo: "Tecnología", "Ropa Mujer", "Clínica Dental", "Mascotas"). No incluyas signos de puntuación ni explicaciones adicionales.`;

    const userPrompt = `Nombre: ${site_name ?? ''}
Descripción: ${site_description ?? ''}
Muestra de Contenido: ${content_sample ?? ''}`;

    const response = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    return NextResponse.json({ success: true, data: response.content.trim() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
