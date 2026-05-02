import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'warm-white': '#FAFAF7',
        'ink':        '#141414',
        'muted':      '#6B6B6B',
        'terracotta': '#C0392B',
        'hairline':   '#E5E2DA',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body:    ['var(--font-inter)',     'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 4px 32px -4px rgba(168, 88, 74, 0.10), 0 1px 4px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

export default config
