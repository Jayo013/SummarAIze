/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    "@tailwindcss/postcss": {},   // <-- use this for Tailwind v4
    autoprefixer: {},
  },
};
