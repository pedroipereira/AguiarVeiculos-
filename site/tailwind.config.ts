import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: '#111111',
        // Near-black gray for the home page sections and the footer (a little lighter than `graphite`).
        charcoal: '#1E1E1E',
        // The soft gray used as the page and footer background.
        paper: '#DCDCDC',
        'aguiar-red': '#D32027',
        // Small red text on black needs a lighter red to stay readable (the brand red gives 3.6:1, the minimum is 4.5:1).
        'aguiar-red-light': '#FF5A60',
        'card-gray': '#F4F4F4',
        'support-gray': '#6E6E6E',
      },
    },
  },
  plugins: [],
}

export default config
