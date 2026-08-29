import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
const { adminSaveTestimonial } = vi.hoisted(() => ({ adminSaveTestimonial: vi.fn(async () => ({ id: 't-1' })) }))
vi.mock('@/app/actions/testimonials', () => ({ adminSaveTestimonial }))
const upload = vi.fn(async () => ({ error: null }))
const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://x/1.jpg' } }))
vi.mock('@/lib/supabase/browser', () => ({
  createBrowserSupabaseClient: () => ({ storage: { from: () => ({ upload, getPublicUrl }) } }),
}))

import { TestimonialForm } from '@/components/admin/TestimonialForm'

describe('TestimonialForm', () => {
  beforeEach(() => { upload.mockClear(); adminSaveTestimonial.mockClear(); push.mockClear() })

  it('uploads an image, fills the caption, and saves', async () => {
    render(<TestimonialForm />)
    const file = new File(['x'], 'cliente.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/imagem/i), { target: { files: [file] } })
    // Wait for the resulting public URL to land in state, not just for the upload
    // call — otherwise the submit below can race the async state update.
    await waitFor(() => expect(getPublicUrl).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/legenda/i), { target: { value: 'Mais um sonho realizado! 🙏' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar depoimento/i }))

    await waitFor(() => expect(adminSaveTestimonial).toHaveBeenCalledWith(
      expect.objectContaining({ caption: 'Mais um sonho realizado! 🙏', imageUrl: 'https://x/1.jpg' }),
    ))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/depoimentos'))
  })

  it('rejects an oversized image with a message and never uploads it', async () => {
    render(<TestimonialForm />)
    const big = new File(['x'], 'enorme.jpg', { type: 'image/jpeg' })
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 })
    fireEvent.change(screen.getByLabelText(/imagem/i), { target: { files: [big] } })

    expect(await screen.findByText(/passa de 5 mb/i)).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
  })

  it('rejects a non-image file', async () => {
    render(<TestimonialForm />)
    const pdf = new File(['x'], 'documento.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText(/imagem/i), { target: { files: [pdf] } })

    expect(await screen.findByText(/não é um formato aceito/i)).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
  })
})
