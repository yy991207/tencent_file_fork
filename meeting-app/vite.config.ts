import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { visualizer } from 'rollup-plugin-visualizer';
import legacy from '@vitejs/plugin-legacy';

const path = require('path');
const fs = require('fs');

// 从根目录 config.yaml 读取 TRTC 配置，避免在源码中硬编码
const configYaml = fs.readFileSync(path.resolve(__dirname, '..', 'config.yaml'), 'utf-8');
const sdkAppIdMatch  = configYaml.match(/sdkAppId:\s*(\d+)/);
const secretKeyMatch = configYaml.match(/secretKey:\s*([a-f0-9A-F]+)/);

const TRTC_SDK_APP_ID  = sdkAppIdMatch  ? Number(sdkAppIdMatch[1])  : 0;
const TRTC_SECRET_KEY  = secretKeyMatch ? secretKeyMatch[1]         : '';

if (!TRTC_SDK_APP_ID || !TRTC_SECRET_KEY) {
  console.warn('[meeting-app/vite] config.yaml 中未找到 trtc.sdkAppId 或 trtc.secretKey');
}

// https://vitejs.dev/config/
export default defineConfig({
  // 构建时注入 TRTC 配置，源码中通过全局常量引用
  define: {
    __TRTC_SDK_APP_ID__: TRTC_SDK_APP_ID,
    __TRTC_SECRET_KEY__: JSON.stringify(TRTC_SECRET_KEY),
  },
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
