import type { SupabaseClient } from '@supabase/supabase-js'
import { getPublishedTestimonials } from '@/lib/queries/testimonials'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'

export async function Depoimentos({ client }: { client: SupabaseClient }) {
  const testimonials = await getPublishedTestimonials(client)
  if (testimonials.length === 0) return null

  return (
    <Section eyebrow="Quem compra recomenda" title="Depoimentos">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="min-w-[280px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={testimonial.image_url} alt="Depoimento de cliente Aguiar Veículos" className="mb-4 rounded" />
            <p>{testimonial.caption}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
