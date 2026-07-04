import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Tightened radius scale: the whole app uses crisper corners than
    // Tailwind's defaults. rounded-xl in old code now renders at 6px.
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '3px',
      md: '4px',
      lg: '5px',
      xl: '6px',
      '2xl': '8px',
      '3xl': '10px',
      full: '9999px',
    },
    extend: {
      colors: {
        ink: '#171512',
        muted: '#5D5A52',
        faint: '#99958A',
        line: '#E6E3DA',
        surface: '#F4F2EC',
        paper: '#FBFAF6',
        accent: {
          DEFAULT: '#1E4B3B',
          hover: '#173B2F',
          soft: '#EDF2EE',
          border: '#C4D3C9',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        urdu: ['var(--font-urdu)', 'serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
