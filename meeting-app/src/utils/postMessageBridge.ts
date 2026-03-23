/**
 * postMessage 通信桥 - Vue 会议子应用侧
 *
 * 消息方向：
 *   子 → 父 (Vue → React): notifyParent()
 *   父 → 子 (React → Vue): onParentMessage()
 */

// ---- 消息类型定义 ----

/** Vue → React 消息类型 */
export const enum ToParentEvent {
  MEETING_READY = 'MEETING_READY',         // Vue 应用就绪
  MEETING_STARTED = 'MEETING_STARTED',     // 进入会议室
  MEETING_ENDED = 'MEETING_ENDED',         // 离开/结束会议
  MEETING_ERROR = 'MEETING_ERROR',         // 会议发生错误
  USER_KICKED = 'USER_KICKED',             // 被踢出会议
  LOGIN_EXPIRED = 'LOGIN_EXPIRED',         // 登录态过期
}

/** React → Vue 消息类型 */
export const enum ToChildEvent {
  CREATE_MEETING = 'CREATE_MEETING',       // 发起会议
  JOIN_MEETING = 'JOIN_MEETING',           // 加入会议
}

export interface CreateMeetingPayload {
  roomId: string;
  roomType?: number;
  // 以下与 TUIRoomKit StartOptions 一一对应
  roomName?: string;
  password?: string;
  isOpenCamera?: boolean;
  isOpenMicrophone?: boolean;
}

export interface JoinMeetingPayload {
  roomId: string;
  roomType?: number;
  password?: string;
}

export interface MeetingStartedPayload {
  roomId: string;
  isHost: boolean;
}

export interface PostMessage<T = unknown> {
  type: string;
  data?: T;
}

// ---- 判断是否在 iframe 中运行 ----
export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

// ---- 向父窗口发送消息 ----
export function notifyParent<T = unknown>(type: ToParentEvent, data?: T): void {
  if (!isInIframe()) return;
  window.parent.postMessage({ type, data } satisfies PostMessage<T>, '*');
}

// ---- 监听来自父窗口的消息 ----
type Handler<T = unknown> = (data: T) => void;

const handlers = new Map<string, Set<Handler<any>>>();

function globalListener(event: MessageEvent<PostMessage>) {
  const { type, data } = event.data ?? {};
  if (!type) return;
  handlers.get(type)?.forEach(fn => fn(data));
}

let listening = false;

export function onParentMessage<T = unknown>(type: ToChildEvent, handler: Handler<T>): () => void {
  if (!listening) {
    window.addEventListener('message', globalListener);
    listening = true;
  }
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type)!.add(handler as Handler);

  // 返回取消监听函数
  return () => handlers.get(type)?.delete(handler as Handler);
}
