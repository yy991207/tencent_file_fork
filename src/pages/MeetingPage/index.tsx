import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store';
import {
  ToParentEvent,
  ToChildEvent,
  MEETING_APP_ORIGIN,
  type MeetingStartedPayload,
  type MeetingEndedPayload,
  type CreateMeetingPayload,
  type RoomScheduledPayload,
  type ScheduledRoomConfigPayload,
} from './postMessageBridge';
import styles from './index.module.less';

export default function MeetingPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = useAppStore((s) => s.currentUser);
  const updateMaterialItemConfig = useAppStore((s) => s.updateMaterialItemConfig);

  // 从 URL 参数读取指令：/meeting?action=start&roomId=123456&roomName=xxx
  const action = searchParams.get('action') as 'start' | 'join' | null;
  const roomId = searchParams.get('roomId');
  const roomName = searchParams.get('roomName');
  // 素材 item ID（用于回写 Zustand 配置）
  const materialItemId = searchParams.get('materialItemId');
  // 研讨会固定使用 Standard（1），默认 1
  const roomType = Number(searchParams.get('roomType') ?? '1');
  const isMicrophoneDisableForAllUser = searchParams.get('isMicrophoneDisableForAllUser') === 'true';
  const isCameraDisableForAllUser = searchParams.get('isCameraDisableForAllUser') === 'true';
  // 预约参数
  const scheduleStartTimeRaw = searchParams.get('scheduleStartTime');
  const scheduleEndTimeRaw = searchParams.get('scheduleEndTime');
  const scheduleAttendeesRaw = searchParams.get('scheduleAttendees');

  // 向 iframe 内的 Vue 应用发送消息
  const sendToChild = useCallback(<T,>(type: ToChildEvent, data?: T) => {
    iframeRef.current?.contentWindow?.postMessage({ type, data }, MEETING_APP_ORIGIN);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== MEETING_APP_ORIGIN) return;

      const { type, data } = event.data ?? {};

      switch (type as ToParentEvent) {
        case ToParentEvent.MEETING_READY: {
          // Vue home.vue 就绪，立即下发指令
          if (action === 'start' && roomId) {
            const payload: CreateMeetingPayload = {
              userId: currentUser?.id,
              roomId,
              roomType,
              roomName: roomName ? decodeURIComponent(roomName) : undefined,
              isMicrophoneDisableForAllUser,
              isCameraDisableForAllUser,
              scheduleStartTime: scheduleStartTimeRaw ? Number(scheduleStartTimeRaw) : undefined,
              scheduleEndTime: scheduleEndTimeRaw ? Number(scheduleEndTimeRaw) : undefined,
              scheduleAttendees: scheduleAttendeesRaw ? scheduleAttendeesRaw.split(',') : undefined,
            };
            sendToChild(ToChildEvent.CREATE_MEETING, payload);
          }
          break;
        }
        case ToParentEvent.MEETING_STARTED: {
          const payload = data as MeetingStartedPayload;
          console.log('[Meeting] 会议已开始', payload);
          break;
        }
        case ToParentEvent.MEETING_ENDED: {
          const payload = data as MeetingEndedPayload;
          console.log('[Meeting] 会议已结束', payload);
          navigate('/');
          break;
        }
        case ToParentEvent.ROOM_SCHEDULED: {
          // scheduleRoom 预约回调 — 记录结果，页面跳回首页
          const payload = data as RoomScheduledPayload;
          console.log('[Meeting] scheduleRoom 结果', payload);
          navigate('/');
          break;
        }
        case ToParentEvent.SCHEDULED_ROOM_CONFIG: {
          // 查询已预约房间的配置回调 — 写入 Zustand 后跳回首页
          const payload = data as ScheduledRoomConfigPayload;
          if (payload.found && materialItemId) {
            updateMaterialItemConfig(materialItemId, {
              roomId: payload.roomId,
              roomName: payload.roomName,
              isMicrophoneDisableForAllUser: payload.isAllMicrophoneDisabled,
              isCameraDisableForAllUser: payload.isAllCameraDisabled,
            });
          }
          navigate('/');
          break;
        }
        case ToParentEvent.USER_KICKED:
        case ToParentEvent.MEETING_ERROR:
        case ToParentEvent.LOGIN_EXPIRED: {
          navigate('/');
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, action, roomId, roomType, roomName, materialItemId, isMicrophoneDisableForAllUser, isCameraDisableForAllUser, scheduleStartTimeRaw, scheduleEndTimeRaw, scheduleAttendeesRaw, sendToChild, currentUser, updateMaterialItemConfig]);

  return (
    <div className={styles.meetingPage}>
      <iframe
        ref={iframeRef}
        src="/meeting-app/"
        className={styles.meetingFrame}
        allow="microphone; camera; display-capture; display; fullscreen"
        title="会议"
      />
    </div>
  );
}

export { ToChildEvent, MEETING_APP_ORIGIN };
export type { CreateMeetingPayload };
