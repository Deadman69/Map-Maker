import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Set to match wherever this repo is published on GitHub Pages
// (https://<user>.github.io/<repo>/ -> base must be '/<repo>/'). Change this
// one constant if the repo is renamed or moved.
const GITHUB_PAGES_BASE = '/map-maker/'

// https://vite.dev/config/
export default defineConfig({
  base: GITHUB_PAGES_BASE,
  plugins: [react()],
  server: {
    port: 5194,
    strictPort: true,
  },
  test: {
    environment: 'node',
  },
})
