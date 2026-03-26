import { defineConfig, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

// 需要通过 Node.js require() 加载的原生/CJS 模块
// 注意: @tencentcloud/tui-core 是 ESM 格式，不在此列表中，让 Vite 正常处理
const NATIVE_MODULES = [
  'trtc-electron-sdk',
  '@tencentcloud/chat',
  'rtc-detect',
  'tim-upload-plugin',
  'tim-profanity-filter-plugin',
  'electron',
  'fabric',
];

// electron 包在 Node 环境里无法像普通 CJS 包一样静态扫描导出，
// 这里手动补一组常用具名导出，满足 `import { ipcRenderer } from "electron"` 这类写法。
const ELECTRON_NAMED_EXPORTS = [
  'app',
  'BrowserWindow',
  'ipcMain',
  'ipcRenderer',
  'contextBridge',
  'shell',
  'desktopCapturer',
  'screen',
  'clipboard',
  'nativeImage',
  'webFrame',
  'session',
  'Menu',
  'MenuItem',
  'Tray',
  'dialog',
  'globalShortcut',
  'powerMonitor',
  'powerSaveBlocker',
  'crashReporter',
  'Notification',
  'webContents',
  'protocol',
];

// fabric 在当前链路下是 CJS 形态，这里手动补具名导出 `fabric`
const FABRIC_NAMED_EXPORTS = ['fabric'];

/**
 * 从模块的 JS 文件中静态提取所有 exports.XXX = 声明的导出名
 * 不执行代码，只做文本匹配，安全地避开 .node 原生模块
 */
function extractAllExportNames(moduleName: string): string[] {
  const keys = new Set<string>();
  try {
    const moduleDir = path.resolve(__dirname, `../../node_modules/${moduleName}`);
    // 递归扫描所有 .js 文件
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          walk(fullPath);
        } else if (entry.name.endsWith('.js')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // 跳过包含原生 .node 加载的文件（避免误报）
            if (content.includes('.node\'') || content.includes('.node"')) continue;
            const matches = content.match(/exports\.(\w+)\s*=/g) || [];
            for (const m of matches) {
              const name = m.replace('exports.', '').replace(/\s*=$/, '');
              if (name !== '__esModule' && name !== 'default') keys.add(name);
            }
          } catch { /* 跳过读取失败的文件 */ }
        }
      }
    }
    walk(moduleDir);
    // TRTCCloud 从 trtc.js 导出，但该文件引用了原生模块，上面会跳过
    // 手动补充
    if (moduleName === 'trtc-electron-sdk') {
      keys.add('TRTCCloud');
    }
  } catch (err) {
    console.warn(`[electronNativePlugin] 扫描 ${moduleName} 失败:`, err);
  }
  return [...keys];
}

/**
 * Vite 插件: 将原生/CJS 模块的 import 重定向到 window.nodeRequire()
 *
 * 原理:
 * 1. 拦截对 NATIVE_MODULES 的 import 请求
 * 2. 返回虚拟 ESM 模块，内部通过 window.nodeRequire 加载真实模块
 * 3. 在插件启动时扫描模块源码，提取所有具名导出，生成完整的 export 语句
 */
function electronNativePlugin(): Plugin {
  const exportCache = new Map<string, string[]>();
  const nativeRequirePattern = new RegExp(
    `\\brequire\\((['"])(${NATIVE_MODULES.map((mod) => mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\1\\)`,
    'g',
  );

  return {
    name: 'electron-native-require',
    enforce: 'pre',

    buildStart() {
      // 预扫描所有原生模块的导出名
      for (const mod of NATIVE_MODULES) {
        if (mod === 'electron') continue; // electron 不需要扫描
        const exports = extractAllExportNames(mod);
        exportCache.set(mod, exports);
        console.log(`[electronNativePlugin] ${mod}: ${exports.length} exports`);
      }
    },

    resolveId(source) {
      if (NATIVE_MODULES.some((m) => source === m || source.startsWith(m + '/'))) {
        return `\0native:${source}`;
      }
      return null;
    },

    load(id) {
      if (!id.startsWith('\0native:')) return null;

      const moduleName = id.slice('\0native:'.length);
      const exportNames = moduleName === 'electron'
        ? ELECTRON_NAMED_EXPORTS
        : moduleName === 'fabric'
          ? FABRIC_NAMED_EXPORTS
          : (exportCache.get(moduleName) || []);

      const lines: string[] = [];
      lines.push(`const _mod = window.nodeRequire('${moduleName}');`);

      if (moduleName === 'fabric') {
        lines.push(`const _fabric = _mod.fabric || _mod;`);
        lines.push(`export const fabric = _fabric;`);
        lines.push(`export default _fabric;`);
        return lines.join('\n');
      }

      lines.push(`export default _mod.default || _mod;`);

      // 为每个具名导出生成 export const XXX = _mod.XXX;
      for (const name of exportNames) {
        // 确保名称是合法的 JS 标识符
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
          lines.push(`export const ${name} = _mod.${name};`);
        }
      }

      return lines.join('\n');
    },

    transform(code, id) {
      // RoomKit 的 es 产物里混着少量 require('electron') 这样的写法。
      // 这些文件一旦走浏览器 ESM 执行，require 就会变成未定义。
      // 这里统一重写成 window.nodeRequire(...)，避免运行时再炸一轮。
      //
      // 同时，白板模块里有 `import { fabric } from "fabric"`，
      // 但 fabric 实际产物在当前链路下不提供具名 `fabric` 导出，
      // 统一改写为默认导入，避免运行时报 “does not provide an export named 'fabric'”。
      if (
        id.includes('/node_modules/@tencentcloud/roomkit-electron-vue3/') ||
        id.includes('/node_modules/@tencentcloud/tuiroom-engine-electron/') ||
        id.includes('/node_modules/@tencentcloud/tui-core/')
      ) {
        let transformedCode = code.replace(nativeRequirePattern, (_match, _quote, moduleName) => {
          return `window.nodeRequire('${moduleName}')`;
        });

        transformedCode = transformedCode.replace(
          /import\s*\{\s*fabric\s*\}\s*from\s*(['"])fabric\1;?/g,
          `import fabric from "fabric";`,
        );

        return transformedCode;
      }

      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    electronNativePlugin(),
    vue(),
  ],
  root: path.resolve(__dirname),
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'electron',
        ...NATIVE_MODULES,
      ],
    },
  },
  optimizeDeps: {
    include: [
      // RoomKit 的 ESM 文件里直接 import interactjs，
      // 但 interactjs 的 main 指向 UMD 文件，dev 原生 ESM 加载会丢 default 导出。
      // 强制预构建后由 esbuild 产出兼容 ESM 包装，避免运行时报 “does not provide an export named 'default'”。
      'interactjs',
    ],
    exclude: [
      '@tencentcloud/roomkit-electron-vue3',
      '@tencentcloud/tuiroom-engine-electron',
      '@tencentcloud/tui-core',
      'trtc-electron-sdk',
      '@tencentcloud/chat',
      'fabric',
      'rtc-detect',
      'tim-upload-plugin',
      'tim-profanity-filter-plugin',
    ],
  },
});
