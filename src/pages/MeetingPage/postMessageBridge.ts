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
  /** scheduleRoom 预约成功回调 */
  ROOM_SCHEDULED = 'ROOM_SCHEDULED',
  /** getScheduledRoomList 查询结果回调 */
  SCHEDULED_ROOM_CONFIG = 'SCHEDULED_ROOM_CONFIG',
}

/** React → Vue 消息类型（父 → 子） */
export const enum ToChildEvent {
  CREATE_MEETING = 'CREATE_MEETING',
  JOIN_MEETING = 'JOIN_MEETING',
  /** 保存时预约房间（不进入会议） */
  SCHEDULE_ROOM = 'SCHEDULE_ROOM',
  /** 查询已预约房间的配置 */
  GET_SCHEDULED_ROOM = 'GET_SCHEDULED_ROOM',
}

/** SCHEDULE_ROOM 指令 payload */
export interface ScheduleRoomPayload {
  userId?: string;
  roomId: string;
  roomName?: string;
  password?: string;
  scheduleStartTime: number;  // 毫秒
  scheduleEndTime: number;    // 毫秒
  scheduleAttendees?: string[];
  isAllMicrophoneDisabled?: boolean;
  isAllCameraDisabled?: boolean;
}

/** ROOM_SCHEDULED 回调 payload */
export interface RoomScheduledPayload {
  roomId: string;
  success: boolean;
  error?: string;
}

/** GET_SCHEDULED_ROOM 指令 payload */
export interface GetScheduledRoomPayload {
  roomId: string;
}

/** SCHEDULED_ROOM_CONFIG 回调 payload（对应 ScheduleRoomOptions 字段） */
export interface ScheduledRoomConfigPayload {
  roomId: string;
  roomName?: string;
  password?: string;
  scheduleStartTime?: number;
  scheduleEndTime?: number;
  scheduleAttendees?: string[];
  isAllMicrophoneDisabled?: boolean;
  isAllCameraDisabled?: boolean;
  found: boolean;
}

export interface MeetingStartedPayload {
  roomId: string;
  isHost: boolean;
}

export interface MeetingEndedPayload {
  roomId: string;
}

export interface CreateMeetingPayload {
  userId?: string;    // TUIRoomKit 登录用的 userId，由 React 传入，Vue 侧自动 login
  roomId: string;
  roomType?: number;
  // 与 TUIRoomKit StartOptions 一一对应
  roomName?: string;
  password?: string;
  isOpenCamera?: boolean;
  isOpenMicrophone?: boolean;
  isMicrophoneDisableForAllUser?: boolean;
  isCameraDisableForAllUser?: boolean;
  // 预约参数（scheduleRoom API）
  scheduleStartTime?: number;   // 毫秒时间戳
  scheduleEndTime?: number;     // 毫秒时间戳
  scheduleAttendees?: string[]; // userId 列表
}

export interface JoinMeetingPayload {
  roomId: string;
  roomType?: number;
  password?: string;
}

// 与 iframe 同域（通过 Vite proxy 统一在 5006 提供），直接用当前页面 origin
export const MEETING_APP_ORIGIN = window.location.origin;