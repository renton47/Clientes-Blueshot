'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError('No pudimos enviarte el enlace. Verifica que el email es correcto.')
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 52,
            height: 52,
            background: 'var(--blue-primary)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontWeight: 800,
            fontSize: 20,
            color: 'white',
            boxShadow: '0 0 30px rgba(7,98,255,0.35)',
          }}>
            B
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Portal de Clientes
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Blueshot · Área privada
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="tucorreo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--error)',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !email}
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Enviando...
                </>
              ) : (
                'Enviar enlace de acceso'
              )}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Te enviaremos un enlace seguro a tu correo. No necesitas contraseña.
            </p>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60,
              height: 60,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 24,
            }}>
              ✉️
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
              Revisa tu correo
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Enviamos un enlace de acceso a{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              <br />Válido por 1 hora.
            </p>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setSent(false); setEmail('') }}
            >
              Usar otro correo
            </button>
          </div>
        )}

        <div style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ¿Eres cliente de WordPress?{' '}
            <a
              href={`${process.env.NEXT_PUBLIC_WP_URL ?? 'https://blueshot.cl'}/mi-cuenta`}
              style={{ color: 'var(--blue-primary)' }}
            >
              Accede desde tu cuenta Blueshot
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
