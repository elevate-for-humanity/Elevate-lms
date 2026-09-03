// ESM PostCSS config — picked up by Turbopack (dev) and webpack (build).
// Points to tailwind.config.cjs which is the CJS-compatible admin Tailwind config.
// The .cjs extension is required because the root tailwind.config.js is ESM
// and cannot be require()'d by PostCSS in a CJS context.
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: path.resolve(__dirname, 'tailwind.config.cjs') },
    autoprefixer: {},
  },
};
