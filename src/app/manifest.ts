import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ConFiaX Visita',
    short_name: 'Visita',
    description: 'Gestão de visitas comerciais às imobiliárias parceiras',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00AEEF',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
