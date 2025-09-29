/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-gradient-to-br',
    'from-purple-700',
    'to-purple-900',
    'from-purple-500',
    'to-violet-600',
    'from-rose-600',
    'to-pink-700',
    'from-blue-500',
    'to-cyan-600',
    'from-green-500',
    'to-emerald-600'
  ],
  theme: {
    extend: {
      colors: {
        // New color palette
        primary: {
          DEFAULT: '#1E40AF', // Blue
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#1E40AF',
          600: '#1D4ED8',
          700: '#1E3A8A',
          hover: '#1E3A8A', // Darker shade for hover
        },
        secondary: {
          DEFAULT: '#6B7280', // Gray
          50: '#F9FAFB',
          100: '#F3F4F6',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
        },
        // Text colors
        text: {
          primary: '#111827', // Dark Gray/Black
          secondary: '#6B7280', // Medium Gray
        },
        // Background colors
        background: {
          DEFAULT: '#FFFFFF', // White
          modal: '#F3F4F6', // Light Gray for popups/modals
        },
        // Border colors
        border: {
          DEFAULT: '#D1D5DB', // Light Gray
        },
        // Accent colors
        accent: {
          teal: '#14B8A6',
          red: '#EF4444',
          yellow: '#F59E0B',
        },
        // UI state colors
        disabled: '#9CA3AF', // Light Gray for disabled UI
      },
    },
  },
  plugins: [],
}
