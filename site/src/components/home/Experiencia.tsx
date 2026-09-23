import Image from 'next/image'
import type { ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { Section, SectionHeader, isLightTone, type SectionTone } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { buttonBase, buttonVariants } from '@/components/ui/buttonStyles'

const ROUTE_LINK =
  'https://www.google.com/maps/dir/?api=1&destination=Aguiar+Ve%C3%ADculos,+Presidente+Dutra+-+MA'

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  className: 'h-5 w-5',
} as const

const pinIcon = (
  <svg {...iconProps}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4.5-7-8.2-7-11.5A7 7 0 0 1 19 9.5C19 12.8 16 16.5 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)
const clockIcon = (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
  </svg>
)
const calendarIcon = (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)

// The invitation, split into a lead, three rows and a closing line. The words are the same, in the same order.
const LEAD = 'Venha conhecer o nosso pátio de perto, ver cada carro com calma e sentir na prática como é comprar na Aguiar.'
const LINHAS: { icon: ReactNode; text: string }[] = [
  {
    icon: pinIcon,
    text: 'Estamos localizados na Av. Campo Dantas, 1689, ao lado do Posto Full, na saída para São Domingos, prontos pra receber você.',
  },
  { icon: clockIcon, text: 'Funcionamos de segunda a sexta, das 7h30 às 17h30, e aos sábados, das 8h às 13h.' },
  {
    icon: calendarIcon,
    text: 'Então é só escolher o dia e o horário que ficam melhores pra você e chamar a gente no WhatsApp pra agendar sua visita, que a gente deixa tudo pronto pra te receber.',
  },
]
const CLOSING = 'Venha conhecer de perto quem vai cuidar de você do começo ao fim, com a atenção e o carinho que você merece.'

/** The "Como chegar" section: an invitation to visit, and the store video (or its front, until the video is saved). */
export async function Experiencia({ client, tone = 'dark' }: { client: SupabaseClient; tone?: SectionTone }) {
  const locationVideoUrl = await getSiteSetting(client, 'location_video_url')
  const light = isLightTone(tone)
  const mediaClass = 'aspect-[9/16] w-full rounded-3xl object-cover'

  return (
    <Section id="como-chegar" tone={tone} contained>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[416px_minmax(0,1fr)] lg:items-center lg:gap-16">
        {/* A rounded frame around the vertical video: 8px of ring around the 400px video. */}
        <div
          data-testid="experiencia-midia"
          className={`mx-auto w-full max-w-[280px] rounded-[2rem] border p-2 sm:max-w-[416px] ${
            light ? 'border-graphite/15 bg-graphite/5' : 'border-white/15 bg-white/5'
          }`}
        >
          {locationVideoUrl ? (
            <video data-testid="location-video" src={locationVideoUrl} controls className={mediaClass} />
          ) : (
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl">
              <Image
                src="/images/fotos/showroom-fachada.jpg"
                alt="Fachada da Aguiar Veículos"
                fill
                sizes="(min-width: 1024px) 416px, 100vw"
                className="object-cover object-left"
              />
            </div>
          )}
        </div>

        <div>
          <SectionHeader eyebrow="Venha nos visitar" title="Venha viver a experiência Aguiar" tone={tone} titleSize="compact" />

          <div data-testid="experiencia-texto" className={`max-w-xl text-lg leading-relaxed ${light ? 'text-graphite/80' : 'text-white/90'}`}>
            <p>{LEAD}</p>
            <ul className={`mt-6 divide-y ${light ? 'divide-graphite/10' : 'divide-white/10'}`}>
              {LINHAS.map((linha) => (
                <li key={linha.text} className="flex items-center gap-4 py-4">
                  <span aria-hidden="true" className={`shrink-0 ${light ? 'text-graphite/70' : 'text-aguiar-red'}`}>
                    {linha.icon}
                  </span>
                  <span className="text-base">{linha.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6">{CLOSING}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <WhatsAppButton
              className="h-12 w-full sm:w-64"
              message="Olá! Vim pelo site da Aguiar Veículos e quero agendar uma visita à loja."
            >
              Agendar minha visita
            </WhatsAppButton>
            <a
              href={ROUTE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} ${light ? buttonVariants.outlineOnLight : buttonVariants.outline} h-12 w-full sm:w-64`}
            >
              Traçar rota
            </a>
          </div>
        </div>
      </div>
    </Section>
  )
}
