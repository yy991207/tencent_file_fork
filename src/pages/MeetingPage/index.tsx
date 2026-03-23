import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ToParentEvent,
  ToChildEvent,
  MEETING_APP_ORIGIN,
  type MeetingStartedPayload,
  type MeetingEndedPayload,
  type CreateMeetingPayload,
} from './postMessageBridge';
import styles from './index.module.less';

export default function MeetingPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 从 URL 参数读取指令：/meeting?action=start&roomId=123456&roomName=xxx
  const action = searchParams.get('action') as 'start' | 'join' | null;
  const roomId = searchParams.get('roomId');
  const roomName = searchParams.get('roomName');

  // 向 iframe 内的 Vue 应用发送消息
  const sendToChild = useCallback(<T>(type: ToChildEvent, data?: T) => {
    iframeRef.current?.contentWindow?.postMessage({ type, data }, MEETING_APP_ORIGIN);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== MEETING_APP_ORIGIN) return;

      const { type, data } = event.data ?? {};

      switch (type as ToParentEvent) {
        case ToParentEvent.MEETING_READY: {
          // Vue home.vue 就绪，立即下发创建/加入指令（跳过图1入口页）
          if (action === 'start' && roomId) {
            const payload: CreateMeetingPayload = {
              roomId,
              roomType: 1,
              roomName: roomName ? decodeURIComponent(roomName) : undefined,
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
  }, [navigate, action, roomId, roomName, sendToChild]);

  return (
    <div className={styles.meetingPage}>
      <iframe
        ref={iframeRef}
        src={MEETING_APP_ORIGIN}
        className={styles.meetingFrame}
        allow="microphone; camera; display-capture; display; fullscreen"
        title="会议"
      />
    </div>
  );
}

export { ToChildEvent, MEETING_APP_ORIGIN };
export type { CreateMeetingPayload };
