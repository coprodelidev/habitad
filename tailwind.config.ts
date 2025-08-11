/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',   // por si tienes pages
    './src/**/*.{js,ts,jsx,tsx,mdx}',     // si usas /src (cubre /src/app y /src/components)
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'lp-blue': '#0074bc',
        'lp-yellow': '#ffc107',
        'lp-dark': '#1d2939',
        'lp-gray': '#667085',
        'lp-bg': '#f8fafc',
      },
      borderRadius: { badge: '14px' },
      fontFamily: { body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
