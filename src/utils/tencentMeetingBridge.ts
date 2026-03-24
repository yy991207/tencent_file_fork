import {
  MEETING_APP_ORIGIN,
  ToChildEvent,
  ToParentEvent,
  type GetScheduledRoomPayload,
  type RoomScheduledPayload,
  type ScheduleRoomPayload,
  type ScheduledRoomConfigPayload,
} from '@/pages/MeetingPage/postMessageBridge';

type BridgeRequestType = ToChildEvent.SCHEDULE_ROOM | ToChildEvent.GET_SCHEDULED_ROOM;

interface PendingRequest {
  type: BridgeRequestType;
  timeoutId: number;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

interface QueuedRequest {
  type: BridgeRequestType;
  data: ScheduleRoomPayload | GetScheduledRoomPayload;
}

const REQUEST_TIMEOUT = 20000;

let bridgeWindow: Window | null = null;
let bridgeReady = false;

const requestQueue: QueuedRequest[] = [];
const pendingRequests = new Map<string, PendingRequest>();

function postToBridge(type: BridgeRequestType, data: ScheduleRoomPayload | GetScheduledRoomPayload) {
  bridgeWindow?.postMessage({ type, data }, MEETING_APP_ORIGIN);
}

function flushQueue() {
  if (!bridgeReady || !bridgeWindow) return;
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (!request) continue;
    postToBridge(request.type, request.data);
  }
}

function createRequestId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `meeting-bridge-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function enqueueRequest<TResponse, TPayload extends ScheduleRoomPayload | GetScheduledRoomPayload>(
  type: BridgeRequestType,
  payload: TPayload,
) {
  const requestId = payload.requestId ?? createRequestId();
  const data = { ...payload, requestId } as TPayload;

  return new Promise<TResponse>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Tencent 会议桥调用超时'));
    }, REQUEST_TIMEOUT);

    pendingRequests.set(requestId, {
      type,
      timeoutId,
      resolve: (value) => resolve(value as TResponse),
      reject,
    });

    if (bridgeReady && bridgeWindow) {
      postToBridge(type, data);
      return;
    }

    requestQueue.push({
      type,
      data,
    });
  });
}

function clearPendingRequest(requestId?: string) {
  if (!requestId) return null;
  const pending = pendingRequests.get(requestId);
  if (!pending) return null;
  window.clearTimeout(pending.timeoutId);
  pendingRequests.delete(requestId);
  return pending;
}

export function registerTencentMeetingBridge(contentWindow: Window | null) {
  bridgeWindow = contentWindow;
}

export function resetTencentMeetingBridge() {
  bridgeReady = false;
  bridgeWindow = null;

  pendingRequests.forEach((pending) => {
    window.clearTimeout(pending.timeoutId);
    pending.reject(new Error('Tencent 会议桥已断开'));
  });
  pendingRequests.clear();
  requestQueue.length = 0;
}

export function markTencentMeetingBridgeReady() {
  bridgeReady = true;
  flushQueue();
}

export function handleTencentMeetingBridgeMessage(type: ToParentEvent, data?: unknown) {
  if (type === ToParentEvent.ROOM_SCHEDULED) {
    const payload = data as RoomScheduledPayload | undefined;
    const pending = clearPendingRequest(payload?.requestId);
    if (!pending) return;

    if (!payload?.success) {
      pending.reject(new Error(payload?.error || 'Tencent 预约失败'));
      return;
    }

    pending.resolve(payload);
    return;
  }

  if (type === ToParentEvent.SCHEDULED_ROOM_CONFIG) {
    const payload = data as ScheduledRoomConfigPayload | undefined;
    const pending = clearPendingRequest(payload?.requestId);
    if (!pending) return;
    pending.resolve(payload);
  }
}

export function scheduleTencentMeeting(payload: ScheduleRoomPayload) {
  return enqueueRequest<RoomScheduledPayload, ScheduleRoomPayload>(ToChildEvent.SCHEDULE_ROOM, payload);
}

export function getTencentScheduledRoomConfig(payload: GetScheduledRoomPayload) {
  return enqueueRequest<ScheduledRoomConfigPayload, GetScheduledRoomPayload>(ToChildEvent.GET_SCHEDULED_ROOM, payload);
}
