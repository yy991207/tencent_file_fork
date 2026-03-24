<template>
  <!-- iframe 嵌入模式：不渲染 PreConferenceView，避免过渡闪烁 -->
  <div v-if="isEmbedded" class="embedded-waiting"></div>
  <PreConferenceView
    v-else
    @logout="handleLogout"
    @create-room="handleCreateRoom"
    @join-room="handleJoinRoom"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { PreConferenceView } from '@tencentcloud/roomkit-web-vue3';
import { useRouter } from 'vue-router';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { useMediaPreference } from '../hooks/useMediaPreference';
import type { TUIRoomType } from 'tuikit-atomicx-vue3/room';
import { isInIframe, notifyParent, onParentMessage, ToParentEvent, ToChildEvent } from '../utils/postMessageBridge';
import type { CreateMeetingPayload } from '../utils/postMessageBridge';
import { SDKAPPID, genTestUserSig } from '../config/basic-info-config';

// iframe 内嵌时不显示 PreConferenceView，直接等待 React 下发指令
const isEmbedded = isInIframe();

const router = useRouter();
const { login } = useLoginState();

const { setMicrophonePreference, setCameraPreference } = useMediaPreference();

const handleCameraPreferenceChange = (isOpen: boolean) => {
  setCameraPreference(isOpen);
};

const handleMicrophonePreferenceChange = (isOpen: boolean) => {
  setMicrophonePreference(isOpen);
};

const handleLogout = () => {
  router.push('/login');
};

const handleCreateRoom = async (roomId: string, roomType: TUIRoomType, options?: { roomName?: string; password?: string; isOpenCamera?: boolean; isOpenMicrophone?: boolean; isMicrophoneDisableForAllUser?: boolean; isCameraDisableForAllUser?: boolean }) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'true');
  router.push({
    path: '/room',
    query: {
      roomId,
      roomType,
      ...(options?.roomName && { roomName: options.roomName }),
      ...(options?.password && { password: options.password }),
      isOpenCamera: String(options?.isOpenCamera ?? true),
      isOpenMicrophone: String(options?.isOpenMicrophone ?? true),
      isMicrophoneDisableForAllUser: String(options?.isMicrophoneDisableForAllUser ?? false),
      isCameraDisableForAllUser: String(options?.isCameraDisableForAllUser ?? false),
    },
  });
};

const handleJoinRoom = async (roomId: string, roomType: TUIRoomType) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'false');
  router.push({
    path: '/room',
    query: { roomId, roomType },
  });
};

let cleanupListener: (() => void) | null = null;

onMounted(() => {
  // 通知 React 父窗口：Vue 应用已就绪，可以下发指令
  notifyParent(ToParentEvent.MEETING_READY);

  // 监听来自 React 父窗口的创建/加入会议指令
  cleanupListener = onParentMessage<CreateMeetingPayload>(ToChildEvent.CREATE_MEETING, async (data) => {
    // iframe 模式下如果尚未登录 TUIRoomKit，用 React 传入的 userId 自动完成登录
    if (isEmbedded && !localStorage.getItem('tuiRoom-userInfo') && data.userId) {
      try {
        const userSig = genTestUserSig(data.userId);
        await login({ userId: data.userId, userSig, sdkAppId: SDKAPPID });
        localStorage.setItem('tuiRoom-userInfo', JSON.stringify({
          SDKAppID: SDKAPPID, userID: data.userId, userSig,
        }));
      } catch (e) {
        console.error('[Meeting] 自动登录失败', e);
      }
    }
    handleCreateRoom(data.roomId, (data.roomType ?? 1) as TUIRoomType, {
      roomName: data.roomName,
      password: data.password,
      isOpenCamera: data.isOpenCamera,
      isOpenMicrophone: data.isOpenMicrophone,
      isMicrophoneDisableForAllUser: data.isMicrophoneDisableForAllUser,
      isCameraDisableForAllUser: data.isCameraDisableForAllUser,
    });
  });
});

onUnmounted(() => {
  cleanupListener?.();
});
</script>

<style lang="scss" scoped>
.embedded-waiting {
  width: 100vw;
  height: 100vh;
  background: #000;  // 与 MeetingPage 的黑色背景一致，无缝衔接
}
</style>
