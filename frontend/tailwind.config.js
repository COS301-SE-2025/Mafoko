/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        accent: {
          pink: '#F00A50',
          yellow: '#F2D001',
          teal: '#00CEAF',
          blue: '#212431',
          white: '#FFFFFF',
        },
        'background-light': '#F5F5F5',
        'background-dark': '#363B4D',
        'secondary-light': '#FFFFFF',
        'secondary-dark': '#212431',
        'tertiary-light': '#212431',
        'tertiary-dark': '#FFFFFF',
        'text-light': '#212431',
        'text-dark': '#FFFFFF',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
