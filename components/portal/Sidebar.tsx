'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Client } from '@/types/database'

interface SidebarProps {
  client: Client
}

const navItems = [
  {
    section: 'Portal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
      { href: '/recursos', label: 'Recursos', icon: '📦' },
    ],
  },
  {
    section: 'Blueshot AI',
    items: [
      { href: '/chat', label: 'Asistente IA', icon: '✦' },
    ],
  },
]

export function Sidebar({ client }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = client.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">B</div>
        <div>
          <div className="sidebar-logo-text">Blueshot</div>
          <div className="sidebar-logo-sub">Portal de Clientes</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer — Perfil del cliente */}
      <div className="sidebar-footer">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px',
          borderRadius: 'var(--radius)',
          marginBottom: 8,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--blue-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {client.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {client.company_name ?? client.email}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}
        >
          <span>↩</span> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
