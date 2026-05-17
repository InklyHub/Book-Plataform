/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1A1410',
          80:  '#3A2F27',
          60:  '#5C4E44',
          40:  '#8C7B70',
          20:  '#BFB3AC',
          10:  '#DDD6D1',
          5:   '#F0EBE6',
        },
        parchment: '#FAF6F0',
        paper:     '#FFFFFF',
        amber: {
          DEFAULT: '#C46B1E',
          light:   '#E8955A',
          pale:    '#FAE8D5',
          dark:    '#A8591A',
        },
        sage: {
          DEFAULT: '#4A6741',
          light:   '#7A9E71',
          pale:    '#E6EDE5',
        },
        terracotta: {
          DEFAULT: '#A8432B',
          pale:    '#F5E0DA',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['Source Serif 4', 'Georgia', 'serif'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        xs:   '0 1px 2px rgba(26,20,16,.06)',
        sm:   '0 2px 8px rgba(26,20,16,.08), 0 1px 2px rgba(26,20,16,.04)',
        md:   '0 4px 20px rgba(26,20,16,.10), 0 2px 6px rgba(26,20,16,.06)',
        lg:   '0 12px 40px rgba(26,20,16,.14), 0 4px 12px rgba(26,20,16,.08)',
        book: '4px 6px 20px rgba(26,20,16,.18), 1px 2px 6px rgba(26,20,16,.10)',
        'book-hover': '6px 10px 30px rgba(26,20,16,.22), 2px 4px 8px rgba(26,20,16,.12)',
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      opacity: {
        8: '0.08',
      },
    },
  },
  plugins: [],
};
