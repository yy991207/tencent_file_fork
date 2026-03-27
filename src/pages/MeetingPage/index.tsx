/**
 * Web 端会议承接页
 * 这里单独用一个全屏页面承接 meeting-app，避免和主布局里的隐藏桥接 iframe 混在一起。
 */
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store';
import {
  MEETING_APP_ORIGIN,
  ToChildEvent,
  ToParentEvent,
  type CreateMeetingPayload,
  type MeetingStartedPayload,
} from '@/utils/postMessageBridge';
import styles from './index.module.less';

function parseBooleanParam(value: string | null, fallback = false) {
  if (value === null) return fallback;
  return value === 'true';
}

export default function MeetingPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = useAppStore((state) => state.currentUser);

  const roomId = searchParams.get('roomId');
  const roomName = searchParams.get('roomName') ?? undefined;
  const roomType = Number(searchParams.get('roomType') ?? '1');
  const password = searchParams.get('password') ?? undefined;
  const scheduleStartTimeRaw = searchParams.get('scheduleStartTime');
  const scheduleEndTimeRaw = searchParams.get('scheduleEndTime');
  const scheduleAttendeesRaw = searchParams.get('scheduleAttendees');
  const isOpenCamera = parseBooleanParam(searchParams.get('isOpenCamera'), true);
  const isOpenMicrophone = parseBooleanParam(searchParams.get('isOpenMicrophone'), true);
  const isMicrophoneDisableForAllUser = parseBooleanParam(searchParams.get('isMicrophoneDisableForAllUser'));
  const isCameraDisableForAllUser = parseBooleanParam(searchParams.get('isCameraDisableForAllUser'));

  const sendToChild = useCallback(<T,>(type: ToChildEvent, data?: T) => {
    iframeRef.current?.contentWindow?.postMessage({ type, data }, MEETING_APP_ORIGIN);
  }, []);

  useEffect(() => {
    if (!roomId) {
      navigate('/', { replace: true });
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== MEETING_APP_ORIGIN) return;

      const { type, data } = event.data ?? {};

      switch (type as ToParentEvent) {
        case ToParentEvent.MEETING_READY: {
          // Web 端入会依赖 React 当前登录用户，这里等子应用 ready 后一次性把配置下发过去。
          if (!currentUser?.id) {
            navigate('/', { replace: true });
            return;
          }

          const payload: CreateMeetingPayload = {
            userId: currentUser.id,
            roomId,
            roomType,
            roomName,
            password,
            isOpenCamera,
            isOpenMicrophone,
            isMicrophoneDisableForAllUser,
            isCameraDisableForAllUser,
            scheduleStartTime: scheduleStartTimeRaw ? Number(scheduleStartTimeRaw) : undefined,
            scheduleEndTime: scheduleEndTimeRaw ? Number(scheduleEndTimeRaw) : undefined,
            scheduleAttendees: scheduleAttendeesRaw ? scheduleAttendeesRaw.split(',') : undefined,
          };
          sendToChild(ToChildEvent.CREATE_MEETING, payload);
          break;
        }
        case ToParentEvent.MEETING_STARTED: {
          const payload = data as MeetingStartedPayload | undefined;
          console.info('[MeetingPage] Web 端已进入会议', payload);
          break;
        }
        case ToParentEvent.MEETING_ENDED:
        case ToParentEvent.MEETING_ERROR:
        case ToParentEvent.USER_KICKED:
        case ToParentEvent.LOGIN_EXPIRED: {
          navigate('/', { replace: true });
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [
    currentUser?.id,
    isCameraDisableForAllUser,
    isMicrophoneDisableForAllUser,
    isOpenCamera,
    isOpenMicrophone,
    navigate,
    password,
    roomId,
    roomName,
    roomType,
    scheduleAttendeesRaw,
    scheduleEndTimeRaw,
    scheduleStartTimeRaw,
    sendToChild,
  ]);

  return (
    <div className={styles.meetingPage}>
      <iframe
        ref={iframeRef}
        src="/meeting-app/"
        className={styles.meetingFrame}
        allow="microphone; camera; display-capture; display; fullscreen"
        title="腾讯会议 Web 端"
      />
    </div>
  );
}
