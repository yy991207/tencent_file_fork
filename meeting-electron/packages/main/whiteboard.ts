/**
 * 白板窗口管理模块
 * 负责白板窗口的创建和生命周期管理
 *
 * 注意: TUIRoomKit Electron 的白板功能由 roomkit 内部管理，
 * 这里提供额外的白板窗口控制能力（如独立窗口、标注窗口等）
 */

import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';

// 白板窗口实例引用
let whiteboardWindow: BrowserWindow | null = null;

/**
 * 初始化白板窗口
 * 创建一个独立的白板窗口，用于会议中的白板协作
 */
export function initWhiteboardWindow(parentWindow: BrowserWindow): BrowserWindow | null {
  if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
    whiteboardWindow.focus();
    return whiteboardWindow;
  }

  whiteboardWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    parent: parentWindow,
    modal: false,
    show: false,
    title: '会议白板',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 窗口准备好后再显示，避免白屏闪烁
  whiteboardWindow.once('ready-to-show', () => {
    whiteboardWindow?.show();
  });

  whiteboardWindow.on('closed', () => {
    whiteboardWindow = null;
  });

  return whiteboardWindow;
}

/**
 * 初始化标注窗口
 * 创建一个透明的覆盖窗口，用于在屏幕上进行标注
 */
export function initAnnotationWindow(parentWindow: BrowserWindow): BrowserWindow | null {
  const annotationWindow = new BrowserWindow({
    width: parentWindow.getBounds().width,
    height: parentWindow.getBounds().height,
    parent: parentWindow,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  return annotationWindow;
}

/**
 * 获取当前白板窗口实例
 */
export function getWhiteboardWindow(): BrowserWindow | null {
  return whiteboardWindow;
}

/**
 * 销毁白板窗口
 */
export function destroyWhiteboardWindow(): void {
  if (whiteboardWindow && !whiteboardWindow.isDestroyed()) {
    whiteboardWindow.close();
    whiteboardWindow = null;
  }
}

/**
 * 注册白板相关的 IPC 事件监听
 */
export function registerWhiteboardIPC(mainWindow: BrowserWindow): void {
  // 打开白板窗口
  ipcMain.handle('whiteboard:open', () => {
    const win = initWhiteboardWindow(mainWindow);
    return !!win;
  });

  // 关闭白板窗口
  ipcMain.handle('whiteboard:close', () => {
    destroyWhiteboardWindow();
    return true;
  });

  // 打开标注模式
  ipcMain.handle('whiteboard:annotation', () => {
    const win = initAnnotationWindow(mainWindow);
    return !!win;
  });
}
