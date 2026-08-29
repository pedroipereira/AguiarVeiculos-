import { describe, it, expect, vi } from 'vitest'
import { getSiteSetting } from '@/lib/queries/site-settings'

describe('getSiteSetting', () => {
  it('returns the value for a known key', async () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => ({ data: { value: 'https://example.com/video.mp4' }, error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await getSiteSetting(client as any, 'location_video_url')
    expect(result).toBe('https://example.com/video.mp4')
  })

  it('returns null when the key is missing', async () => {
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    }
    const client = { from: vi.fn(() => chain) }
    const result = await getSiteSetting(client as any, 'unknown_key')
    expect(result).toBeNull()
  })
})
