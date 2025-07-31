import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ['hls.js', '@react-three/drei', '@react-three/fiber', 'three'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['hls.js', '@react-three/drei', '@react-three/fiber', 'three']
  }
});