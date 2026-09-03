import type { Metadata } from 'next'
import './globals.css'
import { SITE_URL, SITE_NAME } from '@/lib/seo'

const DEFAULT_DESCRIPTION =
  'Aguiar Veículos: mais de 15 anos vendendo carros novos e seminovos com procedência em Presidente Dutra - MA. Financiamento facilitado e troca do seu usado.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Novos e Seminovos em Presidente Dutra - MA`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Novos e Seminovos em Presidente Dutra - MA`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: '/images/showroom-fachada.jpg', width: 1200, height: 800, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Novos e Seminovos em Presidente Dutra - MA`,
    description: DEFAULT_DESCRIPTION,
    images: ['/images/showroom-fachada.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
