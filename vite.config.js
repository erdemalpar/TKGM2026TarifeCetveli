import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages için repo adınızı buraya yazmalısınız: base: '/repo-adi/'
  base: '/TKGM2026TarifeCetveli/',
})
