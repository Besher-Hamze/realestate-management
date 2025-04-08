import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f8ff',
          100: '#ebf1ff',
          200: '#cfdcff',
          300: '#b3c7ff',
          400: '#7a9cff',
          500: '#4271ff',
          600: '#3b66e6',
          700: '#3254bf',
          800: '#284399',
          900: '#21377d',
        },
        secondary: {
          50: '#f2f7f9',
          100: '#e6eff3',
          200: '#c0d7e0',
          300: '#9abdcd',
          400: '#4e8da8',
          500: '#025d82',
          600: '#025475',
          700: '#014662',
          800: '#01384e',
          900: '#012e40',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
} satisfies Config;
