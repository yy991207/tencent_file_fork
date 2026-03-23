import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import legacy from '@vitejs/plugin-legacy';

const path = require('path');

// https://vitejs.dev/config/
export default defineConfig({
  // 固定为 /meeting-app/，由 React 主应用 Vite dev server 代理至此端口
  base: '/meeting-app/',
  server: {
    port: 5173,
    strictPort: true, // 端口被占用时直接报错，而非静默切换到 5174
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    // 产物输出到 React 主应用 public 目录，npm run build 时一并打包进去
    outDir: '../public/meeting-app',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Custom Split Strategy
      },
    },
  },
  plugins: [
    vue({
      // Explanation: Solved the problem of introducing the generation of userSig files.
      // reactivityTransform: true,
    }),
    visualizer({
      // open: true,
    }),
    legacy({
      targets: ['ie >= 11'], // Specify the browser targets here
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'], // Optional polyfills
    }),
  ],
});
