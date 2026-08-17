import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Accede al portal privado de clientes de Blueshot',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
