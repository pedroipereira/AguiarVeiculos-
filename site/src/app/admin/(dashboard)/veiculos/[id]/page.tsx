import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getVehicleByIdAdmin } from '@/lib/queries/vehicles'
import { getVehicleImages } from '@/lib/queries/vehicle-images'
import { getVehicleExpenses } from '@/lib/queries/vehicle-expenses'
import { VehicleForm } from '@/components/admin/VehicleForm'

interface EditVehiclePageProps {
  params: Promise<{ id: string }>
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { id } = await params
  const client = await createServerSupabaseClient()
  const vehicle = await getVehicleByIdAdmin(client, id)
  if (!vehicle) notFound()
  const [images, expenses] = await Promise.all([
    getVehicleImages(client, id),
    getVehicleExpenses(client, id),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase">Editar veículo</h1>
      <VehicleForm vehicle={vehicle} images={images} expenses={expenses} />
    </div>
  )
}
