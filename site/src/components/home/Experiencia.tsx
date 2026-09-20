import type { SupabaseClient } from '@supabase/supabase-js'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { Section, isLightTone, type SectionTone } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { buttonBase, buttonVariants } from '@/components/ui/buttonStyles'

const ROUTE_LINK =
  'https://www.google.com/maps/dir/?api=1&destination=Aguiar+Ve%C3%ADculos,+Presidente+Dutra+-+MA'

/** The "Como chegar" section: an invitation to visit, and the store video (or its front, until the video is saved). */
export async function Experiencia({ client, tone = 'dark' }: { client: SupabaseClient; tone?: SectionTone }) {
  const locationVideoUrl = await getSiteSetting(client, 'location_video_url')
  const light = isLightTone(tone)

  return (
    <Section
      id="como-chegar"
      eyebrow="Venha nos visitar"
      title="Venha viver a experiência Aguiar"
      tone={tone}
      contained
    >
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-16">
        <div>
          <div data-testid="experiencia-texto" className={`max-w-sm space-y-4 text-lg leading-relaxed ${light ? 'text-graphite/80' : 'text-white/80'}`}>
            <p>
              Venha conhecer o nosso pátio de perto, ver cada carro com calma e sentir na prática como é comprar na
              Aguiar. Estamos localizados na Av. Campo Dantas, 1689, ao lado do Posto Full, na saída para São
              Domingos, prontos pra receber você.
            </p>
            <p>
              Funcionamos de segunda a sexta, das 7h30 às 17h30, e aos sábados, das 8h às 13h, então é só escolher o
              dia e horário que fica melhor pra você e chame a gente no WhatsApp pra agendar sua visita, que a gente
              deixa tudo pronto pra te receber.
            </p>
            <p>
              Venha conhecer de perto quem vai cuidar de você do começo ao fim, com a atenção e o carinho que você
              merece.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:max-w-[260px]">
            <WhatsAppButton
              className="h-12 w-full"
              message="Olá! Vim pelo site da Aguiar Veículos e quero agendar uma visita à loja."
            >
              Agendar minha visita
            </WhatsAppButton>
            <a
              href={ROUTE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} ${light ? buttonVariants.outlineOnLight : buttonVariants.outline} h-12 w-full`}
            >
              Traçar rota
            </a>
          </div>
        </div>

        {locationVideoUrl ? (
          <video
            data-testid="location-video"
            src={locationVideoUrl}
            controls
            className="mx-auto aspect-[9/16] w-full max-w-[400px] rounded-2xl object-cover lg:mx-auto"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/fotos/showroom-fachada.jpg"
            alt="Fachada da Aguiar Veículos"
            className="mx-auto aspect-[9/16] w-full max-w-[400px] rounded-2xl object-cover object-left lg:mx-auto"
          />
        )}
      </div>
    </Section>
  )
}
