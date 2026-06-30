import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Actions, GITHUB_REPOSITORY is "owner/repo". For a project page the
// site is served from https://owner.github.io/<repo>/, so the base must be
// "/<repo>/". Locally (no env var) the base stays "/" for `npm run dev`.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]

// https://vite.dev/config/
export default defineConfig({
  base: repo ? `/${repo}/` : '/',
  plugins: [react()],
  server: {
    port: 5193,
    strictPort: true
  },
})
