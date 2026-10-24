/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFCF8',
          100: '#FDF8EE',
          200: '#FAF0DC',
          300: '#F5E4C3',
          400: '#EDD5A0',
        },
        navy: {
          50: '#F0F1F5',
          100: '#D8DBE5',
          200: '#B0B5C9',
          300: '#878EAD',
          400: '#5F6791',
          500: '#374075',
          600: '#2C3360',
          700: '#21264A',
          800: '#171A35',
          900: '#0C0D1F',
          950: '#060710',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        coral: {
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
        },
        sage: {
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },
        brand: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        accent: {
          50: '#FFF7ED',
          500: '#F97316',
          600: '#EA580C',
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display-xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'lifted': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(251, 191, 36, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
    },
  },
  plugins: [],
}
