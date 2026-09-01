import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const { adminSetSiteSetting } = vi.hoisted(() => ({ adminSetSiteSetting: vi.fn() }))
vi.mock('@/app/actions/site-settings', () => ({ adminSetSiteSetting }))

import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm'

describe('SiteSettingsForm', () => {
  it('saves the location video URL', async () => {
    render(<SiteSettingsForm locationVideoUrl={null} stockTurnoverThresholdDays={90} />)
    fireEvent.change(screen.getByLabelText(/vídeo de localização/i), { target: { value: 'https://example.com/como-chegar.mp4' } })
    fireEvent.click(screen.getAllByRole('button', { name: /salvar/i })[0])

    await waitFor(() => expect(adminSetSiteSetting).toHaveBeenCalledWith('location_video_url', 'https://example.com/como-chegar.mp4'))
  })

  it('saves the stock-turnover threshold as a string, in days', async () => {
    render(<SiteSettingsForm locationVideoUrl={null} stockTurnoverThresholdDays={90} />)
    fireEvent.change(screen.getByLabelText(/limiar de giro de estoque/i), { target: { value: '120' } })
    fireEvent.click(screen.getAllByRole('button', { name: /salvar/i })[1])

    await waitFor(() => expect(adminSetSiteSetting).toHaveBeenCalledWith('stock_turnover_threshold_days', '120'))
  })
})
