import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  metadataBase: new URL('https://fanvase.online'),
  title: 'Fanvase — Turn your audience into a community',
  description: 'Fanvase is a creator community & membership platform where creators build paid communities and earn recurring or one-time revenue from their fans. Discover creators, join exclusive communities, publish members-only content, and earn with Refer & Earn.',
  keywords: ['Fanvase', 'creator platform', 'paid community', 'membership platform', 'creator monetization', 'Patreon alternative', 'fan community', 'creator subscriptions', 'refer and earn'],
  applicationName: 'Fanvase',
  icons: { icon: '/fanvase-logo.jpeg', shortcut: '/fanvase-logo.jpeg', apple: '/fanvase-logo.jpeg' },
  openGraph: {
    title: 'Fanvase — Turn your audience into a community',
    description: 'Build paid communities and earn recurring or one-time revenue from your fans. Discover creators and join exclusive communities.',
    url: 'https://fanvase.online',
    siteName: 'Fanvase',
    type: 'website',
    images: [{ url: '/fanvase-logo.jpeg', width: 920, height: 940, alt: 'Fanvase' }],
  },
  twitter: {
    card: 'summary',
    title: 'Fanvase — Turn your audience into a community',
    description: 'Build paid communities and earn from your fans on Fanvase.',
    images: ['/fanvase-logo.jpeg'],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  )
}
