import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        manor: {
          ink: '#0E1116',
          panel: '#161B22',
          line: '#23292F',
          teal: '#38B6A6',
          tealDark: '#2A8C80',
          gold: '#E0B341',
          cream: '#F2E9D8',
          danger: '#E5484D',
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
