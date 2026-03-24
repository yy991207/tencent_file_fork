import { useEffect, useRef } from 'react';
import { MEETING_APP_ORIGIN, ToParentEvent } from '@/pages/MeetingPage/postMessageBridge';
import {
  handleTencentMeetingBridgeMessage,
  markTencentMeetingBridgeReady,
  registerTencentMeetingBridge,
  resetTencentMeetingBridge,
} from '@/utils/tencentMeetingBridge';

export default function TencentMeetingBridge() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== MEETING_APP_ORIGIN) return;

      const { type, data } = event.data ?? {};
      if (type === ToParentEvent.MEETING_READY) {
        registerTencentMeetingBridge(iframeRef.current?.contentWindow ?? null);
        markTencentMeetingBridgeReady();
        return;
      }

      handleTencentMeetingBridgeMessage(type as ToParentEvent, data);
    };

    window.addEventListener('message', handleMessage);
    registerTencentMeetingBridge(iframeRef.current?.contentWindow ?? null);

    return () => {
      window.removeEventListener('message', handleMessage);
      resetTencentMeetingBridge();
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="/meeting-app/"
      title="Tencent Meeting Bridge"
      aria-hidden="true"
      tabIndex={-1}
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        border: 0,
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
