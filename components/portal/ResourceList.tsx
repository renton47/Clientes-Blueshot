'use client'

import { useState } from 'react'
import type { Resource } from '@/types/database'

interface ResourceListProps {
  resources: Resource[]
  clientId: string
}

const TYPE_ICONS: Record<string, string> = {
  zip: '📦',
  guide: '📖',
  document: '📄',
  video: '🎬',
}

const TYPE_LABELS: Record<string, string> = {
  zip: 'Archivo ZIP',
  guide: 'Guía',
  document: 'Documento',
  video: 'Video',
}

export function ResourceList({ resources, clientId }: ResourceListProps) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload(resourceId: string, fileName: string) {
    setDownloading(resourceId)
    setError(null)

    try {
      const response = await fetch('/api/resources/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Error al descargar')
      }

      const { signed_url, file_name } = await response.json()

      // Descarga automática via link temporal
      const a = document.createElement('a')
      a.href = signed_url
      a.download = file_name
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar el archivo')
    } finally {
      setDownloading(null)
    }
  }

  if (resources.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <span style={{ fontSize: 28 }}>📦</span>
        </div>
        <div className="empty-state-title">No hay recursos disponibles</div>
        <div className="empty-state-desc">
          Los materiales del mes aparecerán aquí cuando estén listos.
          Revisa pronto o contacta a tu ejecutivo Blueshot.
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--error)',
          fontSize: 13,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {resources.map((resource) => (
          <div key={resource.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0,
              }}>
                {TYPE_ICONS[resource.resource_type] ?? '📄'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {resource.title}
                </div>
                {resource.description && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {resource.description}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-gray">
                  {TYPE_LABELS[resource.resource_type]}
                </span>
                {resource.file_size && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {(resource.file_size / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date(resource.created_at).toLocaleDateString('es-CL')}
              </span>
            </div>

            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
              onClick={() => handleDownload(resource.id, resource.file_name)}
              disabled={downloading === resource.id}
            >
              {downloading === resource.id ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  Preparando descarga...
                </>
              ) : (
                '↓ Descargar'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
