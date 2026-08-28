import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Aguiar Veículos — Novos e Seminovos em Presidente Dutra - MA',
  description:
    'Aguiar Veículos: mais de 15 anos vendendo carros novos e seminovos com procedência em Presidente Dutra - MA. Financiamento facilitado e troca do seu usado.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
