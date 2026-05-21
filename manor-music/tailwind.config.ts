import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        manor: {
          // Brand palette: navy / gold / gray / white
          navy: '#0F2348',
          navyDeep: '#08172F',
          navyMid: '#1A3160',
          gold: '#E0B341',
          goldDeep: '#B68C2A',
          gray: '#3F4854',
          grayLight: '#6B7280',
          grayMid: '#2C333D',
          white: '#FFFFFF',
          offwhite: '#F4F5F7',
          danger: '#E5484D',

          // Legacy aliases so existing components keep compiling.
          // Map them onto the new palette so the look stays consistent.
          ink: '#08172F',
          panel: '#1A3160',
          line: '#2C333D',
          teal: '#E0B341',
          tealDark: '#B68C2A',
          cream: '#F4F5F7',
        },
      },
      fontFamily: {
        display: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
