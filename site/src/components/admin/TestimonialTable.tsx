'use client'

import { adminDeleteTestimonial, adminSetTestimonialPublished } from '@/app/actions/testimonials'
import type { Testimonial } from '@/lib/types'

export function TestimonialTable({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {testimonials.map((testimonial) => (
        <li key={testimonial.id} className="flex items-center justify-between gap-4 border-b border-support-gray/40 pb-2">
          <span>{testimonial.caption}</span>
          <div className="flex gap-2">
            <button onClick={() => adminSetTestimonialPublished(testimonial.id, !testimonial.is_published)}>
              {testimonial.is_published ? 'Despublicar' : 'Publicar'}
            </button>
            <button
              onClick={() => { if (window.confirm('Excluir este depoimento?')) adminDeleteTestimonial(testimonial.id) }}
              className="text-aguiar-red"
            >
              Excluir
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
