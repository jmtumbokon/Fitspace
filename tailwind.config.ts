import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f3ede3', // warm paper — page background
        bg2: '#ede5d8', // slightly deeper surface
        panel: '#fbf8f2', // card / panel surface
        wood: '#cbb595', // muted oak — closet modules & drawers
        'wood-dk': '#a8906c', // oak shadow / rail
        ink: '#241f1a', // primary text & dark buttons
        'ink-soft': '#5a5046', // secondary text
        rust: '#a8573a', // single warm accent (links, hovers, highlights)
        sage: '#6f7a62', // secondary accent (brand labels etc.)
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Fraunces', 'serif'], // headings, numbers, closet names
        sans: ['var(--font-hanken)', 'Hanken Grotesk', 'sans-serif'], // body, UI, buttons
      },
      borderColor: {
        line: 'rgba(36,31,26,.14)',
        'line-soft': 'rgba(36,31,26,.08)',
      },
      borderRadius: { card: '14px', drawer: '12px', pill: '30px' },
    },
  },
  plugins: [],
}

export default config
