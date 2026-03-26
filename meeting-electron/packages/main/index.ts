/**
 * Electron 主进程入口
 * 负责窗口管理、协议注册、IPC 通信等核心逻辑
 */

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import http from 'http';
import { parseDeepLink, MeetingParams } from './deepLink';
import { registerWhiteboardIPC } from './whiteboard';

// 协议名称
const PROTOCOL_SCHEME = 'tencent-meeting';

// 开发模式下本地桥接服务端口（Web 端通过 HTTP 请求来传递会议参数）
const DEV_BRIDGE_PORT = 17580;

// 主窗口引用
let mainWindow: BrowserWindow | null = null;

// 缓存启动时收到的协议 URL（窗口还没创建时先存着）
let pendingDeepLink: string | null = null;

// ---------- 单实例锁 ----------
// 确保只有一个应用实例运行，重复打开时将参数传给已有实例
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ---------- 协议注册 ----------
// 注册 tencent-meeting:// 协议，让系统知道用这个应用来处理
if (process.defaultApp) {
  // 开发模式下需要传入可执行文件路径
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL_SCHEME, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);
}

/**
 * 创建主窗口
 */
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: '腾讯会议白板',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: false,
      // 腾讯云 RoomKit Electron SDK 需要在渲染进程中直接访问 Node API，
      // 因为它内部依赖 trtc-electron-sdk 原生模块，无法通过 IPC 中转
      nodeIntegration: true,
      // Electron 20+ 默认开启 sandbox，会阻止 preload 访问 Node API
      // RoomKit SDK 需要完整 Node 能力，必须关闭
      sandbox: false,
      // 允许 WebRTC 相关能力
      webSecurity: true,
    },
  });

  // 开发模式加载 Vite 开发服务器，生产模式加载打包后的文件
  // 开发态不要只依赖 NODE_ENV，直接运行 electron . 时通常未注入该变量。
  // !app.isPackaged 可以稳定识别“本地源码启动”场景，避免误走生产分支。
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    // 开发模式下 Vite 端口可能被占用而自动递增，这里用环境变量或默认 5174
    const devPort = process.env.DEV_PORT || '5174';
    mainWindow.loadURL(`http://localhost:${devPort}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  // 外部链接在系统浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 注册白板相关 IPC
  registerWhiteboardIPC(mainWindow);
}

/**
 * 处理协议 URL 或直接的会议参数，解析后发送给渲染进程
 */
function handleDeepLink(url: string): void {
  console.log('[主进程] 收到协议 URL:', url);

  const params = parseDeepLink(url);
  if (!params) {
    console.error('[主进程] 协议 URL 解析失败');
    return;
  }

  sendMeetingParams(params);
}

/**
 * 将会议参数发送给渲染进程
 */
function sendMeetingParams(params: MeetingParams): void {
  console.log('[主进程] 发送会议参数:', params.roomId);

  if (mainWindow && !mainWindow.isDestroyed()) {
    // 窗口已就绪，直接发送参数
    mainWindow.webContents.send('meeting:join', params);
    // 确保窗口在前台
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    // 窗口还没创建，先缓存
    const searchParams = new URLSearchParams({
      roomId: params.roomId,
      userId: params.userId,
      userSig: params.userSig,
      sdkAppId: String(params.sdkAppId),
    });
    if (params.roomName) {
      searchParams.set('roomName', params.roomName);
    }
    pendingDeepLink = `tencent-meeting://join?${searchParams.toString()}`;
  }
}

// ---------- 开发模式桥接服务 ----------
// 开发模式下协议注册不可靠，改用本地 HTTP 服务接收 Web 端请求
// Web 端发 POST http://localhost:17580/join 传入会议参数
function startDevBridgeServer(): void {
  const server = http.createServer((req, res) => {
    // 允许跨域（Web 端在 5006 端口）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/join') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const params = JSON.parse(body) as MeetingParams;
          if (!params.roomId || !params.userId || !params.userSig || !params.sdkAppId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '缺少必要参数' }));
            return;
          }
          sendMeetingParams(params);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '参数解析失败' }));
        }
      });
      return;
    }

    // 健康检查 -- Web 端可以用这个接口探测桌面端是否在线
    if (req.method === 'GET' && req.url === '/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ready', app: 'meeting-electron' }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(DEV_BRIDGE_PORT, '127.0.0.1', () => {
    console.log(`[主进程] 开发桥接服务已启动: http://127.0.0.1:${DEV_BRIDGE_PORT}`);
    console.log(`[主进程] Web 端可通过 POST /join 传入会议参数，GET /ping 探测在线`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[主进程] 端口 ${DEV_BRIDGE_PORT} 已被占用，桥接服务未启动`);
    } else {
      console.error('[主进程] 桥接服务启动失败:', err);
    }
  });
}

// ---------- 应用生命周期 ----------

app.whenReady().then(() => {
  createMainWindow();

  // 启动开发桥接服务（生产环境靠系统协议注册，不需要这个）
  startDevBridgeServer();

  // 如果有缓存的协议 URL（应用还没准备好时收到的），现在处理
  if (pendingDeepLink) {
    handleDeepLink(pendingDeepLink);
    pendingDeepLink = null;
  }

  // macOS 点击 dock 图标重新激活窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// macOS: 通过 open-url 事件接收协议 URL
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Windows/Linux: 第二个实例启动时，从命令行参数获取协议 URL
app.on('second-instance', (_event, commandLine) => {
  // 协议 URL 在命令行参数的最后一个
  const deepLinkUrl = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}://`));
  if (deepLinkUrl) {
    handleDeepLink(deepLinkUrl);
  }

  // 聚焦已有窗口
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ---------- IPC 事件处理 ----------

// 渲染进程请求退出应用
ipcMain.handle('app:exit', () => {
  app.quit();
});

// 渲染进程请求获取缓存的会议参数（页面刷新后重新获取）
ipcMain.handle('meeting:getPendingParams', () => {
  if (pendingDeepLink) {
    const params = parseDeepLink(pendingDeepLink);
    pendingDeepLink = null;
    return params;
  }
  return null;
});
