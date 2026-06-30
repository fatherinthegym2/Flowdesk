import type { Metadata } from 'next'
import { Hanken_Grotesk, Space_Mono } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  title: 'FlowDesk — Структурированный план из любой цели',
  description:
    'Превратите любую цель или список задач в структурированный план действий по профессиональным фреймворкам (MoSCoW, RICE, ICE)',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${hanken.variable} ${spaceMono.variable}`}>
      <body
        className="min-h-screen"
        style={{ backgroundColor: '#f7f4ef', fontFamily: 'var(--font-hanken), sans-serif', color: '#2e2a24' }}
      >
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 5000,
              style: { background: '#1a1a1a', color: '#fff' },
            }}
          />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_ID} />
        )}
      </body>
    </html>
  )
}
