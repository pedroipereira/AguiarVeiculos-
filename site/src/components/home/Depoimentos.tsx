import type { SupabaseClient } from '@supabase/supabase-js'
import { getPublishedTestimonials } from '@/lib/queries/testimonials'
import { Section, type SectionTone } from '@/components/ui/Section'
import { DepoimentosCarousel } from '@/components/home/DepoimentosCarousel'
import { GoogleReviewCta } from '@/components/home/GoogleReviewCta'

export async function Depoimentos({ client, tone = 'dark' }: { client: SupabaseClient; tone?: SectionTone }) {
  const testimonials = await getPublishedTestimonials(client)
  if (testimonials.length === 0) return null

  return (
    <Section eyebrow="Quem compra recomenda" title="Depoimentos" tone={tone} contained>
      <DepoimentosCarousel testimonials={testimonials} tone={tone} />
      <GoogleReviewCta tone={tone} />
    </Section>
  )
}
