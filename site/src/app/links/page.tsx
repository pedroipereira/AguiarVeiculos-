import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getPublishedTestimonials } from '@/lib/queries/testimonials'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { SOCIAL_LINKS } from '@/lib/social-links'
import { LinksCarousel } from '@/components/links/LinksCarousel'

export const metadata: Metadata = {
  title: 'Aguiar Veículos — Links',
  description: 'Estoque, financiamento e contato da Aguiar Veículos em Presidente Dutra - MA, tudo em um só lugar.',
}

const MAPS_URL = 'https://www.google.com/maps?q=Aguiar+Ve%C3%ADculos,+Presidente+Dutra+-+MA'
const GOOGLE_REVIEW_URL = SOCIAL_LINKS.find((item) => item.label === 'Google')!.href

const PRIMARY_BUTTON_CLASS =
  'flex items-center gap-3 rounded-full bg-aguiar-red px-4 py-2.5 font-bold text-white shadow-sm transition-colors hover:bg-red-700'
const OUTLINE_BUTTON_CLASS =
  'flex items-center gap-3 rounded-full border-2 border-white/25 px-4 py-2.5 font-bold text-white transition-colors hover:border-white hover:bg-white/5'

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-white">
      <path
        fill="currentColor"
        d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.148-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.148.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"
      />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-5 w-5 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.5-4-9s1.5-6.5 4-9z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5 shrink-0">
      <path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8-6.1-3.6-6.1 3.6 1.5-6.8-5.2-4.7 6.9-.7z" />
    </svg>
  )
}

export default async function LinksPage() {
  const client = await createServerSupabaseClient()
  const testimonials = await getPublishedTestimonials(client)

  return (
    <main className="flex min-h-screen flex-col items-center bg-graphite px-6 py-16 text-white">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-full.png" alt="Aguiar Veículos" className="h-20 w-auto" />

        <p className="text-support-gray">
          Veículos novos e seminovos em Presidente Dutra - MA.{' '}
          <span className="font-bold text-aguiar-red">Procedência e confiança</span> em cada venda.
        </p>

        <div className="flex w-full flex-col gap-3">
          <a
            href={buildWhatsAppUrl('Olá! Vim pelo link da Aguiar Veículos e quero comprar meu próximo carro.')}
            target="_blank"
            rel="noopener noreferrer"
            className={PRIMARY_BUTTON_CLASS}
          >
            <WhatsAppIcon />
            Compre conosco
          </a>
          <a href="/estoque" className={OUTLINE_BUTTON_CLASS}>
            <GlobeIcon />
            Conheça nosso estoque
          </a>
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className={OUTLINE_BUTTON_CLASS}>
            <PinIcon />
            Onde estamos
          </a>
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className={OUTLINE_BUTTON_CLASS}>
            <StarIcon />
            Avalie nosso atendimento
          </a>
        </div>

        <div className="flex gap-3">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105"
            >
              {item.icon}
            </a>
          ))}
        </div>

        {testimonials.length > 0 && (
          <div className="mt-4 w-full">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-widest">
              <span className="h-2 w-2 shrink-0 rounded-full bg-aguiar-red" aria-hidden="true" />
              Sonhos que ganharam rodas
            </div>
            <LinksCarousel testimonials={testimonials} />
          </div>
        )}
      </div>

      <p className="mt-12 text-sm text-support-gray">Aguiar Veículos — Presidente Dutra, MA</p>
    </main>
  )
}
