/**
 * 预加载脚本
 * contextIsolation 关闭时，直接挂载到 window 对象上
 * （腾讯云 RoomKit SDK 需要 nodeIntegration 开启，contextIsolation 必须关闭）
 */

import { ipcRenderer } from 'electron';

interface MeetingParams {
  roomId: string;
  userId: string;
  userSig: string;
  sdkAppId: number;
  roomName?: string;
}

// 将 Node.js 原生 require 保存到 window，供渲染进程加载腾讯云 SDK
// 原因: Vite dev server 用 ESM 执行代码，全局 require 被覆盖了，
// 但 preload 在 Vite 之前执行，这里的 require 还是 Node.js 原生的
(window as any).nodeRequire = require;

// 直接挂载到 window（contextIsolation: false 模式）
(window as any).electronAPI = {
  // 监听会议加入事件
  onMeetingJoin: (callback: (params: MeetingParams) => void) => {
    ipcRenderer.on('meeting:join', (_event, params: MeetingParams) => {
      callback(params);
    });
  },

  // 获取缓存的会议参数
  getPendingMeetingParams: (): Promise<MeetingParams | null> => {
    return ipcRenderer.invoke('meeting:getPendingParams');
  },

  // 白板相关
  openWhiteboard: (): Promise<boolean> => ipcRenderer.invoke('whiteboard:open'),
  closeWhiteboard: (): Promise<boolean> => ipcRenderer.invoke('whiteboard:close'),
  openAnnotation: (): Promise<boolean> => ipcRenderer.invoke('whiteboard:annotation'),

  // 退出应用
  exitApp: (): Promise<void> => ipcRenderer.invoke('app:exit'),
};
