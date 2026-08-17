import type { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/session'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const session = await getAuthSession()
  if (!session) return null

  const { client } = session
  const supabase = await createServerClient()

  // Obtener estadísticas del cliente
  const [{ count: totalConversations }, { count: totalMessages }, recentConversations, recentResources] =
    await Promise.all([
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('client_id', client.id),
      supabase.from('messages').select('conversations!inner(client_id)', { count: 'exact', head: true }),
      supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('client_id', client.id)
        .eq('archived', false)
        .order('updated_at', { ascending: false })
        .limit(4),
      supabase
        .from('resources')
        .select('id, title, description, resource_type, created_at')
        .or(`scope.eq.all,and(scope.eq.client,client_id.eq.${client.id})`)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

  const firstName = client.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {firstName} 👋</h1>
          <p className="page-subtitle">
            {client.company_name ? `${client.company_name} · ` : ''}Bienvenido a tu portal privado Blueshot
          </p>
        </div>
        <Link href="/chat" className="btn btn-primary">
          <span>✦</span> Abrir Blueshot AI
        </Link>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-card-icon">✦</div>
            <div className="stat-value">{totalConversations ?? 0}</div>
            <div className="stat-label">Conversaciones con IA</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">💬</div>
            <div className="stat-value">{totalMessages ?? 0}</div>
            <div className="stat-label">Mensajes totales</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">📦</div>
            <div className="stat-value">{recentResources.data?.length ?? 0}</div>
            <div className="stat-label">Recursos disponibles</div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Accesos rápidos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { href: '/chat?tool=product_copy', icon: '📦', label: 'Ficha de Producto', desc: 'Genera fichas completas' },
              { href: '/chat?tool=seo_product', icon: '🔍', label: 'SEO de Producto', desc: 'Optimiza para buscadores' },
              { href: '/chat?tool=social_copy', icon: '📱', label: 'Redes Sociales', desc: 'Copy para Instagram y más' },
              { href: '/chat?tool=google_shopping', icon: '🛒', label: 'Google Shopping', desc: 'Atributos optimizados' },
              { href: '/recursos', icon: '📁', label: 'Recursos ZIP', desc: 'Materiales del mes' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="card card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none' }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Conversaciones recientes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Conversaciones recientes</h2>
              <Link href="/chat" style={{ fontSize: 13, color: 'var(--blue-primary)' }}>Ver todas</Link>
            </div>
            {recentConversations.data?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentConversations.data.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/chat?conversation=${conv.id}`}
                    className="card card-sm"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <span style={{ fontSize: 18, opacity: 0.7 }}>✦</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(conv.updated_at).toLocaleDateString('es-CL')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card card-sm" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✦</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Aún no tienes conversaciones
                </div>
                <Link href="/chat" className="btn btn-primary btn-sm">
                  Iniciar con Blueshot AI
                </Link>
              </div>
            )}
          </div>

          {/* Recursos recientes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recursos recientes</h2>
              <Link href="/recursos" style={{ fontSize: 13, color: 'var(--blue-primary)' }}>Ver todos</Link>
            </div>
            {recentResources.data?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentResources.data.map((res) => (
                  <Link
                    key={res.id}
                    href="/recursos"
                    className="card card-sm"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <span style={{ fontSize: 20 }}>📦</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {res.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(res.created_at).toLocaleDateString('es-CL')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card card-sm" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  No hay recursos disponibles aún
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
