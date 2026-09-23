import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
    formats: ['image/avif', 'image/webp'],
    // Vehicle/testimonial photos rarely change once uploaded; the default (60s) makes the
    // CDN re-check on almost every visit. A year is safe — a new upload gets a new URL.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        // Logo, favicon and fallback photos in public/images — same file, same URL, forever.
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
}

export default nextConfig
