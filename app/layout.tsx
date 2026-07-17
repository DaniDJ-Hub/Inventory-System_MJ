import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { ConfirmProvider } from '@/components/providers/confirm-provider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PaperFlow — Sistema de Inventario',
  description: 'Sistema de inventario y punto de venta para papelerías',
  generator: 'PaperFlow',
}

export const viewport: Viewport = {
  themeColor: '#06070a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ConfirmProvider>
            {/* Ambient background layer */}
            <div className="app-bg" aria-hidden="true" />
            <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
              {children}
            </div>
          </ConfirmProvider>
          <Toaster
            toastOptions={{
              style: {
                background: 'var(--ink-800)',
                border: '1px solid var(--line-strong)',
                color: 'var(--text)',
                fontFamily: 'var(--font)',
              },
            }}
          />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}