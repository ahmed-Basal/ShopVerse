/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#040810',
          900: '#070D1A',
          800: '#0D1526',
          700: '#111E33',
          600: '#162440',
          500: '#1A3055',
          400: '#254477',
          300: '#94B3CC',
          200: '#CBE2F4',
          100: '#E8F4FD',
        },
        blue: {
          DEFAULT: '#3B82F6',
          hover: '#60A5FA',
          light: '#93C5FD',
          muted: '#0F2040',
          glow: 'rgba(59,130,246,0.18)',
        },
        cyan: {
          DEFAULT: '#06B6D4',
          hover: '#22D3EE',
          muted: '#082030',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'blue': '0 4px 24px rgba(59,130,246,0.28)',
        'cyan': '0 4px 24px rgba(6,182,212,0.22)',
        'card': '0 8px 32px rgba(0,0,0,0.5)',
        'card-hover': '0 12px 40px rgba(59,130,246,0.2)',
        'glow': '0 0 0 3px rgba(59,130,246,0.2)',
      },
      animation: {
        'slide-down': 'slideDown 0.18s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
