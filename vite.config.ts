import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// 读取 config.yaml，注入 TRTC 调试配置（不写入源码）
const configYaml = fs.readFileSync(path.resolve(__dirname, 'config.yaml'), 'utf-8');
const sdkAppIdMatch  = configYaml.match(/sdkAppId:\s*(\d+)/);
const secretKeyMatch = configYaml.match(/secretKey:\s*([a-f0-9A-F]+)/);
const bizIdMatch     = configYaml.match(/^bizId:\s*(\S+)/m);
const tokenMatch     = configYaml.match(/^token:\s*(\S+)/m);
const meetingBaseUrlMatch = configYaml.match(/^meetingBaseUrl:\s*(\S+)/m);

const TRTC_SDK_APP_ID  = sdkAppIdMatch  ? Number(sdkAppIdMatch[1])  : 0;
const TRTC_SECRET_KEY  = secretKeyMatch ? secretKeyMatch[1]         : '';
const DEBUG_BIZ_ID     = bizIdMatch     ? bizIdMatch[1]             : '';
const DEBUG_TOKEN      = tokenMatch     ? tokenMatch[1]             : '';
const MEETING_BASE_URL = meetingBaseUrlMatch ? meetingBaseUrlMatch[1] : '';

if (!TRTC_SDK_APP_ID || !TRTC_SECRET_KEY) {
  console.warn('[vite] ⚠️  config.yaml 中未找到 trtc.sdkAppId 或 trtc.secretKey');
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __TRTC_SDK_APP_ID__: TRTC_SDK_APP_ID,
    __TRTC_SECRET_KEY__: JSON.stringify(TRTC_SECRET_KEY),
    __DEBUG_BIZ_ID__:    JSON.stringify(DEBUG_BIZ_ID),
    __DEBUG_TOKEN__:     JSON.stringify(DEBUG_TOKEN),
    __MEETING_BASE_URL__: JSON.stringify(MEETING_BASE_URL),
  },
  server: {
    host: true,
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
