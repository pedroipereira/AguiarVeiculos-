import { Anton } from 'next/font/google'

/**
 * Condensed, bold, geometric display face for headings/emphasis — the closest
 * Google-hosted match to the Bebas Neue/Anton reference in identidade/marca.md.
 * Applied selectively (not as the site-wide body font) to keep admin screens legible.
 */
export const anton = Anton({ subsets: ['latin'], weight: '400', display: 'swap' })
