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
  it('uploads an image, fills the caption, and saves', async () => {
    render(<TestimonialForm />)
    const file = new File(['x'], 'cliente.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/imagem/i), { target: { files: [file] } })
    await waitFor(() => expect(upload).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText(/legenda/i), { target: { value: 'Mais um sonho realizado! 🙏' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar depoimento/i }))

    await waitFor(() => expect(adminSaveTestimonial).toHaveBeenCalledWith(
      expect.objectContaining({ caption: 'Mais um sonho realizado! 🙏', imageUrl: 'https://x/1.jpg' }),
    ))
    expect(push).toHaveBeenCalledWith('/admin/depoimentos')
  })
})
