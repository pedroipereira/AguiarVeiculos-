import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminAddSiteImage, adminDeleteSiteImage } = vi.hoisted(() => ({
  adminAddSiteImage: vi.fn(async () => ({ id: 'img-new' })),
  adminDeleteSiteImage: vi.fn(async () => undefined),
}))
vi.mock('@/app/actions/site-images', () => ({ adminAddSiteImage, adminDeleteSiteImage }))

const upload = vi.fn(async () => ({ error: null }))
const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload, getPublicUrl }) } }),
}))

import { SiteImagesSlotManager } from '@/components/admin/SiteImagesSlotManager'

describe('SiteImagesSlotManager', () => {
  beforeEach(() => {
    upload.mockClear()
    adminAddSiteImage.mockClear()
    adminDeleteSiteImage.mockClear()
  })

  it('renders the title, description, and existing images', () => {
    render(
      <SiteImagesSlotManager
        slot="hero"
        title="Fotos do carrossel (Hero)"
        description="Aparecem no topo da Home."
        initialImages={[{ id: 'img-1', url: 'https://cdn.test/a.jpg' }]}
      />,
    )
    expect(screen.getByText('Fotos do carrossel (Hero)')).toBeInTheDocument()
    expect(screen.getByText('Aparecem no topo da Home.')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.test/a.jpg')
  })

  it('disables Adicionar until a valid file is chosen', () => {
    render(<SiteImagesSlotManager slot="hero" title="Hero" description="" initialImages={[]} />)
    expect(screen.getByRole('button', { name: /adicionar/i })).toBeDisabled()
  })

  it('uploads the file, saves it, and adds it to the grid on Adicionar', async () => {
    render(<SiteImagesSlotManager slot="galeria" title="Galeria" description="" initialImages={[]} />)
    const file = new File(['x'], 'showroom.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/foto/i), { target: { files: [file] } })

    const addButton = screen.getByRole('button', { name: /adicionar/i })
    expect(addButton).not.toBeDisabled()
    fireEvent.click(addButton)

    await waitFor(() => expect(upload).toHaveBeenCalled())
    await waitFor(() => expect(adminAddSiteImage).toHaveBeenCalledWith('galeria', expect.stringContaining('showroom.jpg')))
    expect(await screen.findByRole('img')).toHaveAttribute('src', expect.stringContaining('showroom.jpg'))
  })

  it('rejects an oversized file without uploading it', async () => {
    render(<SiteImagesSlotManager slot="hero" title="Hero" description="" initialImages={[]} />)
    const big = new File(['x'], 'enorme.jpg', { type: 'image/jpeg' })
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 })
    fireEvent.change(screen.getByLabelText(/foto/i), { target: { files: [big] } })

    expect(await screen.findByText(/passa de 5 mb/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /adicionar/i })).toBeDisabled()
    expect(upload).not.toHaveBeenCalled()
  })

  it('removes the image from the grid and deletes it on Excluir', async () => {
    render(
      <SiteImagesSlotManager
        slot="sobre"
        title="Sobre"
        description=""
        initialImages={[{ id: 'img-1', url: 'https://cdn.test/a.jpg' }]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    await waitFor(() => expect(adminDeleteSiteImage).toHaveBeenCalledWith('img-1'))
  })
})
