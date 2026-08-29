import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAllTestimonialsAdmin } from '@/lib/queries/testimonials'
import { TestimonialForm } from '@/components/admin/TestimonialForm'
import { TestimonialTable } from '@/components/admin/TestimonialTable'

export default async function AdminDepoimentosPage() {
  const client = await createServerSupabaseClient()
  const testimonials = await getAllTestimonialsAdmin(client)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold uppercase">Depoimentos</h1>
      <TestimonialForm />
      <TestimonialTable testimonials={testimonials} />
    </div>
  )
}
