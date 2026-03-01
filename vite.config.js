import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'PlateVision',
        short_name: 'PlateVision',
        description: 'AI License Plate Detection',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/insurance.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/insurance.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})