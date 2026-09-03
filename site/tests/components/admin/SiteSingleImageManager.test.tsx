import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminReplaceSiteImage } = vi.hoisted(() => ({
  adminReplaceSiteImage: vi.fn(async () => ({ id: 'img-new' })),
}))
vi.mock('@/app/actions/site-images', () => ({ adminReplaceSiteImage }))

const upload = vi.fn(async () => ({ error: null }))
const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload, getPublicUrl }) } }),
}))

import { SiteSingleImageManager } from '@/components/admin/SiteSingleImageManager'

describe('SiteSingleImageManager', () => {
  beforeEach(() => {
    upload.mockClear()
    adminReplaceSiteImage.mockClear()
  })

  it('shows an empty state and an "Adicionar foto" trigger when there is no image yet', () => {
    render(<SiteSingleImageManager slot="hero" title="Hero" description="" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /adicionar foto/i })).toBeInTheDocument()
  })

  it('shows the current photo and a "Trocar foto" trigger when one already exists', () => {
    render(<SiteSingleImageManager slot="hero" title="Hero" description="" initialImageUrl="https://cdn.test/a.jpg" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.test/a.jpg')
    expect(screen.getByRole('button', { name: /trocar foto/i })).toBeInTheDocument()
  })

  it('uploads and replaces the photo as soon as a valid file is chosen', async () => {
    render(<SiteSingleImageManager slot="sobre" title="Quem somos" description="" />)
    const file = new File(['x'], 'fundador.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/foto/i), { target: { files: [file] } })

    await waitFor(() => expect(upload).toHaveBeenCalled())
    await waitFor(() => expect(adminReplaceSiteImage).toHaveBeenCalledWith('sobre', expect.stringContaining('fundador.jpg')))
    expect(await screen.findByRole('img')).toHaveAttribute('src', expect.stringContaining('fundador.jpg'))
  })

  it('rejects an oversized file without uploading it', async () => {
    render(<SiteSingleImageManager slot="hero" title="Hero" description="" />)
    const big = new File(['x'], 'enorme.jpg', { type: 'image/jpeg' })
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 })
    fireEvent.change(screen.getByLabelText(/foto/i), { target: { files: [big] } })

    expect(await screen.findByText(/passa de 5 mb/i)).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
  })

  it('shows an error and does not swap the preview when the upload fails', async () => {
    upload.mockImplementationOnce(async () => ({ error: { message: 'network down' } }))
    render(<SiteSingleImageManager slot="hero" title="Hero" description="" initialImageUrl="https://cdn.test/old.jpg" />)
    const file = new File(['x'], 'novo.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/foto/i), { target: { files: [file] } })

    expect(await screen.findByText(/não foi possível enviar/i)).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.test/old.jpg')
  })
})
