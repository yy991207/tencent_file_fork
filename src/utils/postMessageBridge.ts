/**
 * postMessage 通信桥 - React 主应用侧
 *
 * 与 meeting-app/src/utils/postMessageBridge.ts 保持对称。
 * 仅保留预约/查询相关的消息类型，入会类型已迁移至桌面端协议跳转。
 */

/** Vue -> React 消息类型（子 -> 父） */
export const enum ToParentEvent {
  MEETING_READY = 'MEETING_READY',
  /** scheduleRoom 预约成功回调 */
  ROOM_SCHEDULED = 'ROOM_SCHEDULED',
  /** getScheduledRoomList 查询结果回调 */
  SCHEDULED_ROOM_CONFIG = 'SCHEDULED_ROOM_CONFIG',
}

/** React -> Vue 消息类型（父 -> 子） */
export const enum ToChildEvent {
  /** 保存时预约房间（不进入会议） */
  SCHEDULE_ROOM = 'SCHEDULE_ROOM',
  /** 查询已预约房间的配置 */
  GET_SCHEDULED_ROOM = 'GET_SCHEDULED_ROOM',
}

/** SCHEDULE_ROOM 指令 payload */
export interface ScheduleRoomPayload {
  requestId?: string;
  userId?: string;
  roomId: string;
  roomName?: string;
  password?: string;
  scheduleStartTime: number;  // 秒级时间戳
  scheduleEndTime: number;    // 秒级时间戳
  scheduleAttendees?: string[];
  isAllMicrophoneDisabled?: boolean;
  isAllCameraDisabled?: boolean;
}

/** ROOM_SCHEDULED 回调 payload */
export interface RoomScheduledPayload {
  requestId?: string;
  roomId: string;
  success: boolean;
  error?: string;
}

/** GET_SCHEDULED_ROOM 指令 payload */
export interface GetScheduledRoomPayload {
  requestId?: string;
  userId?: string;
  roomId: string;
}

/** SCHEDULED_ROOM_CONFIG 回调 payload（对应 ScheduleRoomOptions 字段） */
export interface ScheduledRoomConfigPayload {
  requestId?: string;
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

// 与 iframe 同域（通过 Vite proxy 统一在 5006 提供），直接用当前页面 origin
export const MEETING_APP_ORIGIN = window.location.origin;
