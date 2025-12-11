/** @type {import('tailwindcss').Config} */
module.exports = {
  // Where Tailwind looks for class names
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  // Use class-based dark mode so the app can control it via a `dark` class
  darkMode: 'class',

  theme: {
    extend: {
      // Provide a few CSS variables-friendly colors so the existing styles can
      // be migrated gradually to Tailwind using design tokens.
      colors: {
        accent: 'var(--accent-color)',
        bg: 'var(--bg-color)',
        fg: 'var(--fg-color)',
        border: 'var(--border-color)',
        hover: 'var(--hover-color)',
      },

      // A sensible default sans stack; you can replace or extend this with a
      // variable-based font-family if you prefer.
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },

      // Small utility spacing / radius tweaks to match the existing design.
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
      },

      // Subtle drop-shadow used for logos and emphasis
      dropShadow: {
        glow: '0 0 16px rgba(100,108,255,0.35)',
      },
    },
  },

  plugins: [
    // Add Tailwind plugins here when needed, e.g. forms/typography.
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
}
