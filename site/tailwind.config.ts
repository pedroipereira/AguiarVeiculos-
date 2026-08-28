import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: '#111111',
        'aguiar-red': '#D32027',
        'card-gray': '#F4F4F4',
        'support-gray': '#6E6E6E',
      },
    },
  },
  plugins: [],
}

export default config
