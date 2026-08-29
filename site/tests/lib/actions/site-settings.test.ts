import { describe, it, expect, vi } from 'vitest'
import { setSiteSetting } from '@/lib/actions/site-settings'

describe('setSiteSetting', () => {
  it('upserts the key/value pair', async () => {
    const chain: any = { upsert: vi.fn(async () => ({ error: null })) }
    const client = { from: vi.fn(() => chain) }
    await setSiteSetting(client as any, 'location_video_url', 'https://example.com/video.mp4')
    expect(client.from).toHaveBeenCalledWith('site_settings')
    expect(chain.upsert).toHaveBeenCalledWith({ key: 'location_video_url', value: 'https://example.com/video.mp4' })
  })
})
