import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSitemapVehicles } from '@/lib/queries/vehicles'
import { SITE_URL } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = await createServerSupabaseClient()
  const vehicles = await getSitemapVehicles(client)

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/estoque`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/financiamento`, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const vehicleRoutes: MetadataRoute.Sitemap = vehicles.map((vehicle) => ({
    url: `${SITE_URL}/estoque/${vehicle.slug}`,
    lastModified: vehicle.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...vehicleRoutes]
}
