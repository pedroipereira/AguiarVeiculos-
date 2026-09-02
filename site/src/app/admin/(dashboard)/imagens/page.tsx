import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSiteImageUrls, getSiteImages } from '@/lib/queries/site-images'
import { getSiteSetting } from '@/lib/queries/site-settings'
import { getPublicImageUrl } from '@/lib/storage'
import { getAllTestimonialsAdmin } from '@/lib/queries/testimonials'
import { SiteSingleImageManager } from '@/components/admin/SiteSingleImageManager'
import { SiteImagesSlotManager } from '@/components/admin/SiteImagesSlotManager'
import { TestimonialForm } from '@/components/admin/TestimonialForm'
import { TestimonialTable } from '@/components/admin/TestimonialTable'
import { LocationVideoForm } from '@/components/admin/LocationVideoForm'

export default async function AdminImagensPage() {
  const client = await createServerSupabaseClient()

  const [heroImages, sobreImages, galeriaImages, testimonials, locationVideoUrl] = await Promise.all([
    getSiteImageUrls(client, 'hero'),
    getSiteImageUrls(client, 'sobre'),
    getSiteImages(client, 'galeria'),
    getAllTestimonialsAdmin(client),
    getSiteSetting(client, 'location_video_url'),
  ])

  const galeriaEntries = galeriaImages.map((image) => ({
    id: image.id,
    url: getPublicImageUrl(client, 'site-images', image.storage_path),
  }))

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Imagens do site</h1>

      <SiteSingleImageManager
        slot="hero"
        title="Foto do Hero"
        description="Aparece no topo da Home."
        initialImageUrl={heroImages[0]}
      />

      <SiteSingleImageManager
        slot="sobre"
        title="Foto do Quem somos"
        description='Usada na seção "Sobre a Aguiar Veículos" da Home.'
        initialImageUrl={sobreImages[0]}
      />

      <SiteImagesSlotManager
        slot="galeria"
        title="Fotos do Showroom"
        description="Usadas na seção de showroom da Home, na ordem em que forem adicionadas aqui."
        initialImages={galeriaEntries}
      />

      <section className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold">Depoimentos</h2>
          <p className="text-sm text-support-gray">Fotos e legendas exibidas na seção de depoimentos da Home.</p>
        </div>
        <TestimonialForm />
        <TestimonialTable testimonials={testimonials} />
      </section>

      <LocationVideoForm locationVideoUrl={locationVideoUrl} />
    </div>
  )
}
