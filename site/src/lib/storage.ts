import type { SupabaseClient } from '@supabase/supabase-js'

export async function uploadVehicleImage(client: SupabaseClient, file: File): Promise<string> {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await client.storage.from('vehicle-images').upload(path, file)
  if (error) throw error
  return path
}

export function getPublicImageUrl(client: SupabaseClient, bucket: string, path: string): string {
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
