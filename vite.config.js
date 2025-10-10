import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

/**
 * 🚀 Configuration Vite pour Çetelem
 *
 * Ce fichier configure le bundler Vite avec :
 * - Transpilation pour anciens navigateurs (iOS 11+, Android 7+)
 * - Minification optimale
 * - Code splitting intelligent
 * - Variables d'environnement sécurisées
 */

export default defineConfig({
  // Configuration du serveur de développement
  server: {
    port: 8000,
    open: true,
    host: true // Pour tester sur mobile (192.168.x.x)
  },

  // Configuration du build de production
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Désactiver en production pour sécurité

    // Optimisation du bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en production
        drop_debugger: true
      }
    },

    // Code splitting par défaut
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les vendors dans un chunk distinct
          'vendor': ['@supabase/supabase-js'],
          'utils': [
            './src/utils/validators.js',
            './src/utils/rate-limiter.js',
            './src/utils/error-handler.js'
          ]
        }
      }
    },

    // Taille maximale des chunks (500kb warning)
    chunkSizeWarningLimit: 500
  },

  // Plugin pour compatibilité anciens navigateurs
  plugins: [
    legacy({
      // Cibles navigateurs
      targets: [
        'iOS >= 11',        // iPhone 5s et +
        'Android >= 7',     // ~95% des appareils Android
        'Chrome >= 60',
        'Safari >= 11',
        'Firefox >= 60',
        'Edge >= 79'
      ],

      // Polyfills à inclure automatiquement
      polyfills: [
        'es.promise.all-settled',
        'es.promise.finally',
        'es.object.from-entries',
        'es.array.flat',
        'es.array.flat-map',
        'es.string.replace-all',
        'es.array.includes',
        'es.string.includes',
        'es.object.entries',
        'es.object.values'
      ],

      // Générer des chunks legacy séparés
      // Les navigateurs modernes chargent le bundle moderne
      // Les anciens navigateurs chargent le bundle legacy
      modernPolyfills: true,

      // Support regenerator pour async/await
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],

  // Configuration des variables d'environnement
  envPrefix: 'VITE_',

  // Optimisation des dépendances
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  },

  // Configuration PWA (si ajout @vite/plugin-pwa)
  // Décommenter si vous installez vite-plugin-pwa
  /*
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Çetelem',
      short_name: 'Çetelem',
      description: 'Progressive Web App pour compter et suivre vos zikirs',
      theme_color: '#667eea',
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      globPatterns: ['**\/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'cdn-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    }
  }
  */
})
