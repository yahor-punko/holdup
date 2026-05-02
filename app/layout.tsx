import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Holdup — sell it while you\'re streaming',
  description: 'Hold up a QR. Start an auction. Sell it before the timer ends. A weekend experiment. Not a product yet.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Holdup',
    description: 'Hold up a QR. Start an auction. Sell it before the timer ends.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Holdup',
    description: 'Hold up a QR. Start an auction. Sell it before the timer ends.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="bg-warm-white text-ink font-body antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
