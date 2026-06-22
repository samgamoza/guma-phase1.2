import type { Metadata } from 'next'
import './globals.css'
import AuthHashHandler from './AuthHashHandler'

export const metadata: Metadata = {
  title: {
    default: 'Guma AI — Your Business Website Already Exists. Claim It in Minutes.',
    template: '%s · Guma AI',
  },
  description:
    'Guma AI is an AI website builder for small businesses. We may have already generated a business website for you — search your name, claim it, customize it, and launch a local business website in minutes.',
  keywords: [
    'AI website builder',
    'website builder Philippines',
    'small business website',
    'AI-generated website',
    'business website generator',
    'local business websites',
  ],
  openGraph: {
    siteName: 'Guma AI',
    type: 'website',
    title: 'Your Business Website Already Exists. Claim It in Minutes.',
    description:
      'Search your business name. If Guma AI has already generated a website for your business, claim it, customize it, and launch instantly.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Business Website Already Exists — Claim It in Minutes',
    description:
      'AI-generated business websites, ready to claim. Search your business name and launch a professional local website in minutes.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Guma AI create websites?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Guma AI generates a complete, industry-matched website from public business information, then keeps it ready for the owner to claim, customize, and launch.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it free to claim my website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Claiming and activating your website is completely free with no credit card required. You can upgrade to Pro for a custom domain and more features when ready.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use my own domain name?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Pro plans support custom domains, so you can connect yourbusiness.com and remove all Guma AI branding for a fully professional presence.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need technical skills to manage my website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Everything is designed for business owners with zero technical experience. You can edit your business name, description, photos, hours and services anytime from your dashboard.',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  )
}
