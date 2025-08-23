import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from the frontend .env file
dotenv.config({ path: './src/pages/.env' })

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Add proxy for API requests in development
      '/api': {
        target: 'https://job-portal-backend-629b.onrender.com',
        changeOrigin: true,
        secure: false,
        xfwd: true
      }
    },
    cors: true
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Optimize bundle size
    minify: 'terser',
    
    // Configure terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'], // Remove specific console methods
      },
      format: {
        comments: false, // Remove comments
      },
    },
    
    rollupOptions: {
      output: {
        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
        
        // Advanced manual chunking for optimal loading
        manualChunks(id) {
          // Vendor libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            
            // Routing
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            
            // UI libraries
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-ui';
            }
            
            // Utilities
            if (id.includes('lodash') || id.includes('axios') || id.includes('date-fns')) {
              return 'vendor-utils';
            }
            
            // Other vendor code
            return 'vendor';
          }
          
          // App chunks
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
          
          if (id.includes('/src/components/')) {
            return 'components';
          }
          
          if (id.includes('/src/utils/')) {
            return 'utils';
          }
        },
      },
      
      // External dependencies that shouldn't be bundled
      external: [],
      
      // Tree shaking optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    
    // Source maps for production debugging (optional)
    sourcemap: false,
    
    // Enable gzip compression hint
    reportCompressedSize: true,
  },
  preview: {
    port: 3000,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
