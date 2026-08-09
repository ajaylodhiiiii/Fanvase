import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Fanvase — Turn your audience into a community',
  description: 'Fanvase lets creators build paid communities and earn recurring or one-time revenue from their fans.',
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
