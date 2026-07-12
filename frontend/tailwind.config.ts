import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest:  '#659287',
        sage:    '#88BDA4',
        mist:    '#B1D3B9',
        dew:     '#E6F2DD',
        charcoal:'#2D3A35',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
