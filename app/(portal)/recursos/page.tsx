import type { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/session'
import { createServerClient } from '@/lib/supabase/server'
import { ResourceList } from '@/components/portal/ResourceList'

export const metadata: Metadata = {
  title: 'Recursos',
}

export default async function RecursosPage() {
  const session = await getAuthSession()
  if (!session) return null

  const { client } = session
  const supabase = await createServerClient()

  // Obtener recursos accesibles para este cliente (RLS se encarga del resto)
  const { data: resources, error } = await supabase
    .from('resources')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recursos</h1>
          <p className="page-subtitle">
            Materiales exclusivos disponibles para ti como cliente Blueshot
          </p>
        </div>
      </div>

      <div className="page-body">
        {error ? (
          <div style={{
            padding: '16px',
            background: 'rgba(239,68,68,0.1)',
            borderRadius: 'var(--radius)',
            color: 'var(--error)',
            fontSize: 14,
          }}>
            Error al cargar recursos. Intenta recargar la página.
          </div>
        ) : (
          <ResourceList resources={resources ?? []} clientId={client.id} />
        )}
      </div>
    </>
  )
}
