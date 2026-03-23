/**
 * postMessage 通信桥 - React 主应用侧
 *
 * 与 meeting-app/src/utils/postMessageBridge.ts 保持对称
 */

/** Vue → React 消息类型（子 → 父） */
export const enum ToParentEvent {
  MEETING_READY = 'MEETING_READY',
  MEETING_STARTED = 'MEETING_STARTED',
  MEETING_ENDED = 'MEETING_ENDED',
  MEETING_ERROR = 'MEETING_ERROR',
  USER_KICKED = 'USER_KICKED',
  LOGIN_EXPIRED = 'LOGIN_EXPIRED',
}

/** React → Vue 消息类型（父 → 子） */
export const enum ToChildEvent {
  CREATE_MEETING = 'CREATE_MEETING',
  JOIN_MEETING = 'JOIN_MEETING',
}

export interface MeetingStartedPayload {
  roomId: string;
  isHost: boolean;
}

export interface MeetingEndedPayload {
  roomId: string;
}

export interface CreateMeetingPayload {
  roomId: string;
  roomType?: number;
  // 与 TUIRoomKit StartOptions 一一对应
  roomName?: string;
  password?: string;
  isOpenCamera?: boolean;
  isOpenMicrophone?: boolean;
  isMicrophoneDisableForAllUser?: boolean;
  isCameraDisableForAllUser?: boolean;
}

export interface JoinMeetingPayload {
  roomId: string;
  roomType?: number;
  password?: string;
}

// 与 iframe 同域（通过 Vite proxy 统一在 5006 提供），直接用当前页面 origin
export const MEETING_APP_ORIGIN = window.location.origin;
