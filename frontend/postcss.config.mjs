/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},   // <-- use this for Tailwind v4
    autoprefixer: {},
  },
};

export default config;
