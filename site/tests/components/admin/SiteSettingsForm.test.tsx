import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminSetSiteSetting } = vi.hoisted(() => ({ adminSetSiteSetting: vi.fn() }))
vi.mock('@/app/actions/site-settings', () => ({ adminSetSiteSetting }))

import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm'

describe('SiteSettingsForm', () => {
  it('saves the location video URL', async () => {
    render(<SiteSettingsForm locationVideoUrl={null} />)
    fireEvent.change(screen.getByLabelText(/vídeo de localização/i), { target: { value: 'https://example.com/como-chegar.mp4' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(adminSetSiteSetting).toHaveBeenCalledWith('location_video_url', 'https://example.com/como-chegar.mp4'))
  })
})
