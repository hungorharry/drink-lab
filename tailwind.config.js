/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#fef9ef",
        "surface-dim": "#ded9d1",
        "surface-bright": "#fef9ef",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8f3ea",
        "surface-container": "#f3ede4",
        "surface-container-high": "#ede8df",
        "surface-container-highest": "#e7e2d9",
        "on-surface": "#1d1c16",
        "on-surface-variant": "#444748",
        primary: "#141413",
        "on-primary": "#ffffff",
        "primary-container": "#242321",
        secondary: "#615e5a",
        "secondary-container": "#e7e2dc",
        "on-secondary-container": "#676460",
        tertiary: "#9a6c1e",
        "tertiary-gold": "#d4af37",
        "celestial-gold": "#e9b949",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        outline: "#747878",
        "outline-variant": "#c4c7c7"
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
        arial: ["Arial", "Helvetica", "sans-serif"],
        cinzel: ["Arial", "Helvetica", "sans-serif"], // Đồng bộ theo yêu cầu tập trung chủ yếu là Arial
        mono: ["Consolas", "Courier New", "monospace"]
      },
      boxShadow: {
        'celestial': '0 0 35px rgba(212, 175, 55, 0.4), 0 0 10px rgba(255, 215, 0, 0.25)',
        'card-3d': '0 15px 35px -5px rgba(20, 20, 19, 0.18), 0 5px 15px rgba(0, 0, 0, 0.08)'
      }
    },
  },
  plugins: [],
};
