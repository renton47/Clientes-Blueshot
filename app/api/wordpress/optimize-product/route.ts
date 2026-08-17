import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/provider';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const supabase = createServiceClient();

    const { data: installation, error } = await supabase
      .from('wordpress_installations')
      .select('client_id, active, clients(name, company_name, active, tone_of_voice)')
      .eq('token', token)
      .eq('active', true)
      .single();

    const client = Array.isArray(installation.clients) ? installation.clients[0] : installation.clients;

    if (error || !installation || !client?.active) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { product } = body;
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product data required' }, { status: 400 });
    }

    const tone = client.tone_of_voice || 'Profesional';

    const provider = getAIProvider();
    const systemPrompt = `Eres un experto en Copywriting y SEO para WooCommerce. Tono: ${tone}.
Genera contenido optimizado para el producto.
Responde ÚNICAMENTE en JSON con la siguiente estructura:
{
  "title": "Nuevo Título SEO",
  "short_description": "Descripción corta de max 160 chars.",
  "description": "Descripción HTML larga...",
  "meta_title": "Meta title SEO",
  "meta_description": "Meta desc",
  "slug": "slug-optimizado",
  "primary_keyword": "keyword",
  "secondary_keywords": ["k1", "k2"],
  "faq": [{"question": "Q?", "answer": "A"}]
}`;

    const userPrompt = JSON.stringify(product, null, 2);

    const response = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    try {
      const jsonStr = response.content.replace(/^\s*```json\s*/, '').replace(/\s*```\s*$/, '');
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json({ success: true, data: parsed });
    } catch (parseError) {
      console.error('Failed to parse AI response:', response.content);
      return NextResponse.json({ success: false, error: 'Invalid AI response' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
