import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminSetSiteSetting } = vi.hoisted(() => ({ adminSetSiteSetting: vi.fn() }))
vi.mock('@/app/actions/site-settings', () => ({ adminSetSiteSetting }))

import { LocationVideoForm } from '@/components/admin/LocationVideoForm'

describe('LocationVideoForm', () => {
  it('saves the location video URL', async () => {
    render(<LocationVideoForm locationVideoUrl={null} />)
    fireEvent.change(screen.getByLabelText(/link do vídeo/i), { target: { value: 'https://example.com/como-chegar.mp4' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(adminSetSiteSetting).toHaveBeenCalledWith('location_video_url', 'https://example.com/como-chegar.mp4'))
  })

  it('prefills the existing video URL', () => {
    render(<LocationVideoForm locationVideoUrl="https://example.com/existing.mp4" />)
    expect(screen.getByLabelText(/link do vídeo/i)).toHaveValue('https://example.com/existing.mp4')
  })
})
