/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'base':           'var(--bg-0)',
        'base-1':         'var(--bg-1)',
        'base-2':         'var(--bg-2)',
        'surface':        'var(--bg-card)',
        'surface-hover':  'var(--bg-card-hover)',
        'surface-raised': 'var(--bg-raised)',
        // Accent — electric cyan
        'accent':         'var(--cyan)',
        'accent-mid':     'var(--cyan-mid)',
        'accent-dim':     'var(--cyan-dim)',
        'accent-glow':    'var(--cyan-glow)',
        'accent-border':  'var(--cyan-border)',
        // Accent — amber (prices, CTAs)
        'price':          'var(--amber)',
        'price-dim':      'var(--amber-dim)',
        'price-glow':     'var(--amber-glow)',
        'price-border':   'var(--amber-border)',
        // Semantic
        'success':        'var(--green)',
        'danger':         'var(--red)',
        'violet':         'var(--violet)',
        // Text
        'primary':        'var(--text-1)',
        'secondary':      'var(--text-2)',
        'muted':          'var(--text-3)',
        'dark':           'var(--bg-0)',
        // Borders (used as background colors for dividers)
        'border-subtle':  'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong':  'var(--border-strong)',
        'border-accent':  'var(--cyan-border)',
      },
      borderColor: {
        'subtle':  'var(--border-subtle)',
        'default': 'var(--border-default)',
        'strong':  'var(--border-strong)',
        'accent':  'var(--cyan-border)',
        'price':   'var(--amber-border)',
      },
      boxShadow: {
        'card':       'var(--shadow-card)',
        'elevated':   'var(--shadow-elevated)',
        'glow-cyan':  'var(--shadow-cyan)',
        'glow-amber': 'var(--shadow-amber)',
      },
      borderRadius: {
        'sm': 'var(--r-sm)',
        'md': 'var(--r-md)',
        'lg': 'var(--r-lg)',
        'xl': 'var(--r-xl)',
      },
      fontFamily: {
        'display': ['Syne', 'sans-serif'],
        'body':    ['Outfit', 'sans-serif'],
        'mono':    ['"Space Mono"', 'monospace'],
      },
      animation: {
        'glow-pulse':   'glow-pulse 2s ease-in-out infinite',
        'fade-up':      'fadeUpIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':      'fadeIn 0.15s ease both',
        'slide-right':  'slideInRight 0.3s ease both',
        'pulse-border': 'pulse-border 2s ease-in-out infinite',
        'shimmer':      'shimmer-text 3s linear infinite',
        'glow-in':      'glow-in 0.25s ease both',
        'slide-down':   'slide-down 0.2s ease both',
      },
    },
  },
  plugins: [],
}
