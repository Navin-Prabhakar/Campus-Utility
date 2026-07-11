import type { MetadataRoute } from 'next';
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Campus Utility',
    short_name: 'Campus Utility',
    description: 'IITP Campus Utility Hub',
    
    // 🛠️ CRITICAL LINES: This forces the standalone PWA to launch straight onto the Home Page!
    start_url: '/', 
    scope: '/',
    
    display: 'standalone',
    background_color: '#050505', // Matches your body bg [#050505] for a seamless splash screen
    theme_color: '#2d162f',       // Matches your dark violet accent layer
    
    icons: [
      {
        src: '/CU-logo1.png',
        sizes: 'any',
        type: 'image/png',
      },
      // If you have standard 192x192 or 512x512 PWA icons, list them here:
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}