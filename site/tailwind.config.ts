import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: '#111111',
        // The soft gray used as the page and footer background.
        paper: '#DCDCDC',
        'aguiar-red': '#D32027',
        // Small red text on black needs a lighter red to stay readable (the brand red gives 3.6:1, the minimum is 4.5:1).
        'aguiar-red-light': '#FF5A60',
        'card-gray': '#F4F4F4',
        'support-gray': '#6E6E6E',
      },
      keyframes: {
        // The numbers strip: the track holds two identical halves, so sliding half its width loops seamlessly.
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // The phone bar of the vehicle page slides up when it appears.
        'bar-in': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        // The little arrow under "Role para expandir" nudges down and back.
        'hint-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(5px)' },
        },
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
        'hint-bounce': 'hint-bounce 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
