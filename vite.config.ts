import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5006,
    proxy: {
      // 将 /meeting-app/** 代理到 Vue 子应用，iframe src 改用 /meeting-app/
      '/meeting-app': {
        target: 'http://localhost:5173',
        ws: true,        // 同时代理 WebSocket（Vite HMR）
        changeOrigin: true,
      },
      // 代理后端接口，解决跨域
      '/jeecg-boot': {
        target: 'https://test-guoren-admin.grtcloud.net',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 明确入口，防止 Vite 把 meeting-app/index.html 也当成 React 项目入口扫描
  optimizeDeps: {
    entries: ['index.html'],
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
})
