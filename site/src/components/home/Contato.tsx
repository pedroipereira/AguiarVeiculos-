import type { SupabaseClient } from '@supabase/supabase-js'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { Section } from '@/components/ui/Section'

export async function Contato({ client }: { client: SupabaseClient }) {
  const locationVideoUrl = await getSiteSetting(client, 'location_video_url')

  return (
    <Section eyebrow="Venha nos visitar" title="Contato">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p>BR-135, Campo Dantas, Presidente Dutra - MA</p>
          <p>(98) 99103-0107</p>
          <a
            href="https://www.instagram.com/aguiarveiculospk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-aguiar-red hover:underline"
          >
            @aguiarveiculospk
          </a>
          <iframe
            title="Mapa até a Aguiar Veículos"
            src="https://www.google.com/maps?q=BR-135,+Campo+Dantas,+Presidente+Dutra+-+MA&output=embed"
            className="mt-4 h-64 w-full rounded"
          />
          <WhatsAppButton message="Olá! Vim pelo site da Aguiar Veículos e quero saber mais.">
            Falar no WhatsApp
          </WhatsAppButton>
        </div>
        {locationVideoUrl && (
          <video data-testid="location-video" src={locationVideoUrl} controls className="w-full rounded" />
        )}
      </div>
    </Section>
  )
}
