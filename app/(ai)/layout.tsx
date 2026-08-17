import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/session'
import { Sidebar } from '@/components/portal/Sidebar'

export default async function AILayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  return (
    <div className="portal-layout">
      <Sidebar client={session.client} />
      <main className="main-content" style={{ padding: 0, overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}
