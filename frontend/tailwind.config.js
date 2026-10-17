/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        mercury: {
          black: '#0a0a0a',
          dark: '#111111',
          gray: {
            900: '#1a1a1a',
            800: '#2d2d2d',
            700: '#404040',
            600: '#595959',
            500: '#737373',
            400: '#8f8f8f',
            300: '#b3b3b3',
            200: '#d4d4d4',
            100: '#e8e8e8',
            50: '#f5f5f5',
          },
          white: '#ffffff',
          off: '#fafafa',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mercury-blob': 'radial-gradient(ellipse at center, #2a2a2a 0%, #111111 40%, #000000 100%)',
      },
      animation: {
        'blob-float': 'blobFloat 8s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        blobFloat: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-15px) scale(1.02)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'mercury-sm': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'mercury': '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'mercury-lg': '0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        'mercury-glow': '0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
