/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        // page & surface — warm light
        canvas: '#f6f7f2',
        card: '#ffffff',
        hairline: '#edefe7',
        // text — warm charcoal
        ink: '#34382f',
        sub: '#969a8c',
        faint: '#c3c7ba',
        // brand — sage green (小当家)
        brand: {
          DEFAULT: '#7d9c57',
          deep: '#6b8a48',
          soft: '#eef4e6',
          mist: '#f5f8f0',
        },
        // low-saturation status colors
        good: '#6fae5a',
        goodsoft: '#e9f3e2',
        warn: '#e0a15a',
        warnsoft: '#faf0e2',
        bad: '#e07a6a',
        badsoft: '#fbeae6',
        mock: '#b59a6a',
        mocksoft: '#f4eede',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card: '0 2px 14px rgba(53,56,47,0.05), 0 1px 3px rgba(53,56,47,0.04)',
        lift: '0 10px 32px rgba(53,56,47,0.10), 0 2px 8px rgba(53,56,47,0.05)',
        soft: '0 4px 18px rgba(53,56,47,0.06)',
        brand: '0 8px 24px rgba(125,156,87,0.28)',
        inset: 'inset 0 1px 2px rgba(53,56,47,0.04)',
      },
    },
  },
  plugins: [],
}
