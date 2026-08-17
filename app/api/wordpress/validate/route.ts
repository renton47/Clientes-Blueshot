import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token missing' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createServiceClient();

    const { data: installation, error } = await supabase
      .from('wordpress_installations')
      .select('client_id, active, clients(name, company_name, active)')
      .eq('token', token)
      .eq('active', true)
      .single();

    if (error || !installation) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive token' }, { status: 401 });
    }

    const client = Array.isArray(installation.clients) ? installation.clients[0] : installation.clients;

    if (!client?.active) {
      return NextResponse.json({ success: false, error: 'Invalid or inactive token' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      client: {
        name: client.name,
        company_name: client.company_name
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
