import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Production-optimized Vite configuration
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['clsx', 'tailwind-merge']
        }
      },
      external: (id) => {
        // Exclude problematic packages
        if (id.includes('hls.js')) return true;
        return false;
      }
    },
    target: 'es2015',
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    exclude: ['hls.js']
  }
});