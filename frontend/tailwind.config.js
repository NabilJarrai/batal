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
    'to-emerald-600',
    // Notification colors
    'bg-red-50',
    'bg-yellow-50',
    'bg-blue-50',
    'border-red-200',
    'border-yellow-200',
    'border-blue-200',
    'text-red-700',
    'text-yellow-700',
    'text-blue-700',
    'text-red-600',
    'text-yellow-600',
    'text-blue-600',
    // Chart and component background colors
    'bg-secondary-50',
    'bg-secondary-100',
    'hover:bg-secondary-50',
    'hover:bg-secondary-100',
    // Primary colors
    'bg-primary',
    'hover:bg-primary-hover',
    'text-primary',
    'border-primary',
    'border-primary/30',
    'bg-primary/10',
    'bg-primary/20',
    'hover:bg-primary/30',
    'focus:ring-primary',
    'focus:ring-primary/50',
    // Accent colors
    'bg-accent-teal/20',
    'hover:bg-accent-teal/30',
    'border-accent-teal/30',
    'hover:bg-accent-teal',
    // Secondary colors for gradients
    'from-secondary-700',
    'via-secondary-600',
    'to-accent-teal',
    'bg-secondary-800',
    // Background gradients
    'from-primary/5',
    'via-white',
    'to-accent-teal/5',
    // Assessment form specific colors
    'bg-accent-teal/10',
    'border-accent-teal/20',
    'bg-accent-yellow/10',
    'border-accent-yellow/20',
    'bg-orange-100',
    'text-orange-600',
    'border-orange-200',
    'bg-red-100',
    'border-red-200',
    'bg-orange-500',
    'text-orange-500',
    'ring-accent-teal/20',
    'ring-accent-yellow/20',
    'ring-orange-200',
    'ring-red-200',
    'hover:shadow-xl',
    'transform',
    'hover:scale-110'
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
