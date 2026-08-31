import type { SupabaseClient } from '@supabase/supabase-js'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_VEHICLE_IMAGES = 15

/**
 * Checked before anything is sent to Storage. The `accept` attribute on the file
 * input is only a picker hint and can be bypassed, so type and size are verified
 * here too (spec §Erros).
 */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" não é um formato aceito. Envie uma imagem JPG, PNG ou WEBP.`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" passa de 5 MB. Envie uma imagem menor.`
  }
  return null
}

export async function uploadVehicleImage(client: SupabaseClient, file: File): Promise<string> {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await client.storage.from('vehicle-images').upload(path, file)
  if (error) throw error
  return path
}

export async function uploadSiteImage(client: SupabaseClient, file: File): Promise<string> {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await client.storage.from('site-images').upload(path, file)
  if (error) throw error
  return path
}

export function getPublicImageUrl(client: SupabaseClient, bucket: string, path: string): string {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
