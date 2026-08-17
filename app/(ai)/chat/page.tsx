import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/session'
import { createServerClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/ai/ChatInterface'

export const metadata: Metadata = {
  title: 'Blueshot AI',
}

export default async function ChatPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const supabase = await createServerClient()
  const { client, settings } = session

  // Obtener herramientas y conversaciones en paralelo
  const [toolsResult, conversationsResult] = await Promise.all([
    supabase
      .from('ai_tools')
      .select('*')
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('conversations')
      .select('*')
      .eq('client_id', client.id)
      .eq('archived', false)
      .order('updated_at', { ascending: false })
      .limit(30),
  ])

  return (
    <ChatInterface
      client={client}
      settings={settings}
      tools={toolsResult.data ?? []}
      initialConversations={conversationsResult.data ?? []}
    />
  )
}
