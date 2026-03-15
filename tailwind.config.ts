import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0A0A0F',
          50: '#F0F0F5',
          100: '#E0E0EB',
          200: '#C1C1D6',
          300: '#9191B8',
          400: '#62629A',
          500: '#3D3D7C',
          600: '#2A2A5E',
          700: '#1A1A40',
          800: '#0F0F25',
          900: '#0A0A0F',
        },
        aurora: {
          green: '#00FF88',
          teal: '#00D4FF',
          purple: '#8B5CF6',
          pink: '#FF006E',
          orange: '#FF6B35',
          yellow: '#FFD60A',
        },
        surface: {
          DEFAULT: '#111118',
          raised: '#1A1A24',
          overlay: '#22222E',
          border: '#2A2A3A',
        },
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #00FF88 0%, #00D4FF 50%, #8B5CF6 100%)',
        'card-glow': 'radial-gradient(ellipse at top, rgba(0,255,136,0.1) 0%, transparent 60%)',
        'hero-mesh': 'radial-gradient(at 40% 20%, hsla(168,100%,50%,0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(265,89%,66%,0.05) 0px, transparent 50%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulse_glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,255,136,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0,255,136,0.6)' },
        },
        slide_up: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        check_bounce: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        streak_fire: {
          '0%, 100%': { transform: 'scaleY(1) rotate(-2deg)' },
          '50%': { transform: 'scaleY(1.1) rotate(2deg)' },
        }
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        float: 'float 3s ease-in-out infinite',
        pulse_glow: 'pulse_glow 2s ease-in-out infinite',
        slide_up: 'slide_up 0.4s ease-out',
        check_bounce: 'check_bounce 0.3s ease-out',
        streak_fire: 'streak_fire 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
