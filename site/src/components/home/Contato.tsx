import type { SupabaseClient } from '@supabase/supabase-js'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { Section, type SectionTone } from '@/components/ui/Section'
import { buttonBase } from '@/components/ui/buttonStyles'

const INFO = [
  {
    label: 'Endereço',
    value: 'Av. Campo Dantas, 1689, Presidente Dutra - MA',
    href: 'https://www.google.com/maps?q=Aguiar+Ve%C3%ADculos,+Presidente+Dutra+-+MA',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4.5-7-8.2-7-11.5A7 7 0 0 1 19 9.5C19 12.8 16 16.5 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
    ),
  },
  {
    label: 'Ponto de referência',
    value: 'Ao lado do Posto Full, na saída para São Domingos',
    href: undefined,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 22V3" />
      </svg>
    ),
  },
  {
    label: 'Telefone / WhatsApp',
    value: '(98) 99103-0107',
    href: 'tel:+5598991030107',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
        />
      </svg>
    ),
  },
  {
    label: 'Email',
    value: 'aguiarveiculospdutra@hotmail.com',
    href: 'mailto:aguiarveiculospdutra@hotmail.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
]

export async function Contato({ client, tone }: { client: SupabaseClient; tone?: SectionTone }) {
  const locationVideoUrl = await getSiteSetting(client, 'location_video_url')

  return (
    <Section
      id="contato"
      eyebrow="Vamos conversar"
      title={
        <>
          Vamos achar o <span className="text-aguiar-red">seu carro?</span>
        </>
      }
      tone={tone}
      contained
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 md:p-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <p className="max-w-md text-support-gray">
              Chama no WhatsApp e fala com o time. A gente te mostra o estoque atualizado, avalia
              seu usado e tira todas as suas dúvidas na hora.
            </p>
            <div className="flex flex-wrap gap-4">
              <WhatsAppButton message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
                Falar no WhatsApp
              </WhatsAppButton>
              <a
                href="https://www.instagram.com/aguiarveiculospk"
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonBase} border-2 border-white text-white transition-colors hover:bg-white hover:text-graphite`}
              >
                Instagram
              </a>
            </div>
            <div className="flex flex-col gap-8 border-t border-white/10 pt-6">
              {INFO.map((item) => (
                <div key={item.label} className={`flex min-w-0 items-start gap-3 ${item.href ? 'group' : ''}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-aguiar-red/10 text-aguiar-red">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-support-gray">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        {...(item.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="break-words font-bold transition-colors group-hover:text-aguiar-red"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="break-words font-bold">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-aguiar-red/10 text-aguiar-red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-support-gray">Horário</p>
                  <p className="font-bold">Segunda a sexta, 7h30 às 17h30</p>
                  <p className="text-support-gray">Sábado, 8h às 13h</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-support-gray">Localização</p>
              <iframe
                title="Mapa até a Aguiar Veículos"
                src="https://www.google.com/maps?q=Aguiar+Ve%C3%ADculos,+Presidente+Dutra+-+MA&output=embed"
                className="h-56 w-full rounded-lg"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-support-gray">Como chegar</p>
              {locationVideoUrl ? (
                <video
                  data-testid="location-video"
                  src={locationVideoUrl}
                  controls
                  className="aspect-[9/16] w-64 rounded-lg object-cover"
                />
              ) : (
                <div
                  data-testid="location-video-placeholder"
                  className="flex aspect-[9/16] w-64 items-center justify-center rounded-lg border border-dashed border-white/20 p-3 text-center text-xs text-support-gray"
                >
                  Vídeo vertical de como chegar até a loja
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
