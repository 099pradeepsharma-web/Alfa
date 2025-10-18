import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
        // Performance: Optimized development server
        server: {
            port: 3000,
            host: '0.0.0.0',
            // Enable HMR for faster development
            hmr: {
                port: 24678,
            },
            // Optimize dev server performance
            fs: {
                // Allow serving files outside of root for better module resolution
                allow: ['..'],
            },
        },
        
        // Performance: Enhanced build optimization
        build: {
            // Optimize chunk sizes for better loading
            rollupOptions: {
                output: {
                    // Split vendor dependencies for better caching
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom'],
                        'vendor-google': ['@google/genai'],
                        'vendor-icons': ['@heroicons/react', 'lucide-react'],
                        'vendor-utils': ['@dicebear/core', '@dicebear/collection'],
                        'vendor-charts': ['recharts'],
                        'vendor-db': ['@supabase/supabase-js']
                    },
                    // Better chunk naming for debugging
                    chunkFileNames: 'assets/[name]-[hash].js',
                    entryFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash].[ext]'
                },
            },
            // Optimize bundle size
            minify: 'esbuild',
            target: 'es2020',
            // Generate source maps for better debugging
            sourcemap: mode === 'development',
            // Reduce bundle size warnings threshold
            chunkSizeWarningLimit: 1000,
        },
        
        // Performance: Optimized dependencies
        optimizeDeps: {
            // Pre-bundle these dependencies for faster dev startup
            include: [
                'react',
                'react-dom',
                '@google/genai',
                '@heroicons/react/24/solid',
                '@heroicons/react/24/outline',
                'lucide-react',
                '@dicebear/core',
                '@dicebear/collection',
                'recharts'
            ],
            // Exclude problematic packages from pre-bundling
            exclude: []
        },
        
        plugins: [react({
            // Performance: Optimize React development
            babel: {
                plugins: [
                    // Remove console.log in production
                    mode === 'production' ? 'babel-plugin-transform-remove-console' : null
                ].filter(Boolean)
            },
            // Fast refresh for better development experience
            fastRefresh: true,
        })],
        
        // CRITICAL FIX: Proper environment variable handling
        define: {
            // Ensure Gemini API key is properly injected
            'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
            'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
            // Add other environment variables as needed
            'process.env.NODE_ENV': JSON.stringify(mode),
        },
        
        // Path resolution for cleaner imports
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
                '@components': path.resolve(__dirname, './components'),
                '@screens': path.resolve(__dirname, './screens'),
                '@services': path.resolve(__dirname, './services'),
                '@hooks': path.resolve(__dirname, './hooks'),
                '@utils': path.resolve(__dirname, './utils'),
                '@types': path.resolve(__dirname, './types.ts'),
                '@data': path.resolve(__dirname, './data'),
            },
        },
        
        // Enable better error overlay in development
        clearScreen: false,
        
        // Performance: CSS optimization
        css: {
            devSourcemap: mode === 'development',
            // Optimize CSS processing
            preprocessorOptions: {
                css: {
                    charset: false
                }
            }
        },
        
        // Worker support for future enhancements
        worker: {
            format: 'es'
        },
        
        // JSON optimization
        json: {
            namedExports: true,
            stringify: false
        },
        
        // Prevent external dependencies from being bundled
        external: mode === 'development' ? [] : ['fsevents'],
    };
});