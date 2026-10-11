import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#F8F7F5', primary: '#171717', secondary: '#6B6B6B',
        accent: '#C89B6D', success: '#3D8B5F', warning: '#D99A32', danger: '#C94A4A',
      },
      borderRadius: { card: '16px' },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      },
      animation: { 'fade-in': 'fadeIn .3s ease-out', 'slide-in': 'slideIn .3s ease-out' },
    },
  },
  plugins: [],
};
export default config;