import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Portal de Clientes — Blueshot',
    template: '%s | Blueshot',
  },
  description:
    'Portal privado de clientes de Blueshot. Accede a tus recursos, documentos y Blueshot AI, tu asistente especializado en e-commerce y marketing digital.',
  robots: { index: false, follow: false },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
