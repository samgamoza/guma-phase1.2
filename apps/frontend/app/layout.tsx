import type { Metadata } from 'next'
import './globals.css'
import AuthHashHandler from './AuthHashHandler'

export const metadata: Metadata = {
  title: { default: 'Guma AI', template: '%s · Guma AI' },
  description: 'Free websites for local businesses — auto-generated, instantly claimable.',
  openGraph: {
    siteName: 'Guma AI',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  )
}
