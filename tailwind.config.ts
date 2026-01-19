import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Active Wellness Color Palette - Warm Neutrals & Rich Rust
        wellness: {
          // Primary Rust/Terracotta
          50: '#FDF5F4',
          100: '#F9E8E6',
          200: '#F4D1CD',
          300: '#EEBAB4',
          400: '#E9A39B',
          500: '#B44C45', // Primary Rust
          600: '#A34139',
          700: '#8B372F',
          800: '#732D27',
          900: '#5B241F',
        },
        'wellness-neutral': {
          // Warm Cream/Beige
          50: '#FDFCFB',
          100: '#F9F7F5',
          200: '#F3F0ED',
          300: '#ECE3DC', // Primary Neutral
          400: '#E0D3C9',
          500: '#D4C3B6',
          600: '#C8B3A3',
          700: '#B09886',
          800: '#8B7A6B',
          900: '#6B5F52',
        },
        'wellness-blue': {
          // Muted Blue-Grey (accent)
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#0D0F12',
        },
        'wellness-success': {
          // Muted Green (for success states)
          50: '#F4F8F4',
          100: '#E3EFE3',
          200: '#C7DFC7',
          300: '#ABCFAB',
          400: '#8FBF8F',
          500: '#6BA76B',
          600: '#5A8F5A',
          700: '#4A774A',
          800: '#3A5F3A',
          900: '#2A472A',
        },
        'wellness-warning': {
          // Deeper Rust (for warnings/alerts)
          50: '#FDF6F5',
          100: '#FAE9E6',
          200: '#F5D3CD',
          300: '#F0BDB4',
          400: '#EBA79B',
          500: '#B54E47', // Accent Rust
          600: '#A4433C',
          700: '#8C3832',
          800: '#742E29',
          900: '#5C2420',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
