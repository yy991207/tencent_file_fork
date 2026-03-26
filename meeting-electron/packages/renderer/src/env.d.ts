/**
 * 全局类型声明
 * 为 window.electronAPI 提供类型定义
 */

interface MeetingParams {
  roomId: string;
  userId: string;
  userSig: string;
  sdkAppId: number;
  roomName?: string;
}

interface ElectronAPI {
  // 会议相关
  onMeetingJoin: (callback: (params: MeetingParams) => void) => void;
  getPendingMeetingParams: () => Promise<MeetingParams | null>;

  // 白板相关
  openWhiteboard: () => Promise<boolean>;
  closeWhiteboard: () => Promise<boolean>;
  openAnnotation: () => Promise<boolean>;

  // 应用控制
  exitApp: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    // nodeIntegration: true 模式下，Electron 渲染进程可用 require 加载原生模块
    require?: NodeRequire;
    // preload 会提前缓存一份 Node 原生 require，避免被 Vite 的运行时环境干扰
    nodeRequire?: NodeRequire;
  }
}

export {};
