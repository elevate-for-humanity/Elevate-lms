// PostCSS config for the admin app.
// Must export a plain object — Next.js does not allow function exports.
//
// Use an absolute path for the Tailwind config. A relative path like
// './tailwind.config.cjs' resolves from the repo root (where Next.js runs),
// not from apps/admin/ — the file doesn't exist there, so Tailwind gets
// undefined config and crashes on tailwindConfig.blocklist.
//
// xterm.css is served from public/xterm.css (copied from node_modules at
// build time) to avoid running through this PostCSS pipeline entirely.
const path = require('path');

module.exports = {
  plugins: {
    tailwindcss: { config: path.resolve(__dirname, 'tailwind.config.cjs') },
    autoprefixer: {},
  },
};
