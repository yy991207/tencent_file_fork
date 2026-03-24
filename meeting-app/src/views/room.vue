<template>
  <!-- 等待主播开始时显示遮罩，不显示会议室界面 -->
  <div v-if="waitingForHost" class="waiting-overlay">
    <div class="waiting-card">
      <div class="waiting-spinner"></div>
      <p class="waiting-title">等待主播开始直播…</p>
      <p class="waiting-hint">将在 {{ retryCountdown }} 秒后自动重试（已等待 {{ retryCount }} 次）</p>
      <button class="waiting-cancel" @click="cancelWaiting">取消</button>
    </div>
  </div>
  <ConferenceMainView v-else />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { ComponentName, conference, ConferenceMainView, RoomEvent as ConferenceRoomEvent } from '@tencentcloud/roomkit-web-vue3';
import {
  useLoginState,
  useRoomState,
  useDeviceState,
  VideoQuality,
  useRoomParticipantState,
  useRoomModal,
  RoomType,
} from 'tuikit-atomicx-vue3/room';
import { useRoute, useRouter } from 'vue-router';
import { useMediaPreference } from '../hooks/useMediaPreference';
import { notifyParent, ToParentEvent, isInIframe } from '../utils/postMessageBridge';

conference.setComponentConfig({ componentName: ComponentName.AIToolsButton, visible: true });

const route = useRoute();
const router = useRouter();
const { handleErrorWithModal } = useRoomModal();

const { loginUserInfo } = useLoginState();
const { currentRoom } = useRoomState();
const { localVideoQuality, openLocalCamera, updateVideoQuality, openLocalMicrophone } = useDeviceState();
const { muteMicrophone, unmuteMicrophone } = useRoomParticipantState();

const { getMicrophonePreference, getCameraPreference } = useMediaPreference();

const { roomId, password, roomType: roomTypeString, roomName, isOpenCamera: isOpenCameraStr, isOpenMicrophone: isOpenMicrophoneStr, isMicrophoneDisableForAllUser: isMuteAllStr, isCameraDisableForAllUser: isCameraDisabledStr, scheduleStartTime: scheduleStartTimeStr, scheduleEndTime: scheduleEndTimeStr, scheduleAttendees: scheduleAttendeesStr } = route.query as {
  roomId: string;
  password?: string;
  roomType: string;
  roomName?: string;
  isOpenCamera?: string;
  isOpenMicrophone?: string;
  isMicrophoneDisableForAllUser?: string;
  isCameraDisableForAllUser?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  scheduleAttendees?: string;
};
const roomType = Number(roomTypeString) as RoomType;
const isOpenCameraParam = isOpenCameraStr !== 'false';
const isOpenMicrophoneParam = isOpenMicrophoneStr !== 'false';
const isMicrophoneDisableForAllUser = isMuteAllStr === 'true';
const isCameraDisableForAllUser = isCameraDisabledStr === 'true';
const scheduleStartTime = scheduleStartTimeStr ? Number(scheduleStartTimeStr) : undefined;
const scheduleEndTime = scheduleEndTimeStr ? Number(scheduleEndTimeStr) : undefined;
const scheduleAttendees = scheduleAttendeesStr ? scheduleAttendeesStr.split(',').filter(Boolean) : [];

if (!roomId) {
  router.replace('/home');
}

watch(() => loginUserInfo.value?.userId, async (userId) => {
  if (!userId || !roomId || currentRoom.value?.roomId) {
    return;
  }
  await handleEnterRoom();
}, { immediate: true });

watch(() => currentRoom.value?.roomId, async (currentRoomId, prevRoomId) => {
  if (!prevRoomId && currentRoomId) {
    if (currentRoom.value?.roomType === RoomType.Webinar && currentRoom.value?.roomOwner.userId !== loginUserInfo.value?.userId) {
      return;
    }
    handleOpenCamera();
    handleOpenMicrophone();
  }
}, { immediate: true });

const MAX_RETRY = 20;          // 最多重试 20 次（约 100 秒）
const RETRY_INTERVAL = 5;      // 每次等待 5 秒

const waitingForHost = ref(false);
const retryCount = ref(0);
const retryCountdown = ref(RETRY_INTERVAL);

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function startCountdown() {
  retryCountdown.value = RETRY_INTERVAL;
  countdownTimer = setInterval(() => {
    retryCountdown.value--;
    if (retryCountdown.value <= 0) {
      clearInterval(countdownTimer!);
    }
  }, 1000);
}

function scheduleRetry() {
  if (retryCount.value >= MAX_RETRY) {
    waitingForHost.value = false;
    router.replace('/home');
    return;
  }
  startCountdown();
  retryTimer = setTimeout(async () => {
    retryCount.value++;
    try {
      await handleJoinConference();
      waitingForHost.value = false;  // 成功进入，隐藏遮罩
    } catch {
      scheduleRetry();  // 仍然失败，继续等待
    }
  }, RETRY_INTERVAL * 1000);
}

function cancelWaiting() {
  if (retryTimer) clearTimeout(retryTimer);
  if (countdownTimer) clearInterval(countdownTimer);
  waitingForHost.value = false;
  router.replace('/home');
}

async function handleEnterRoom() {
  const isCreateKey = `room-${roomId}-isCreate`;
  const isCreate = sessionStorage.getItem(isCreateKey) === 'true';
  sessionStorage.removeItem(isCreateKey);
  try {
    if (isCreate) {
      await handleStartConference();
    } else {
      await handleJoinConference();
    }
  } catch (error: any) {
    if (!isCreate) {
      // 加入失败（房间尚未创建）→ 等待主播并自动重试
      waitingForHost.value = true;
      scheduleRetry();
    } else {
      handleErrorWithModal(error);
      router.replace('/home');
    }
  }
}

async function handleStartConference() {
  const defaultRoomName = `${loginUserInfo.value?.userName || loginUserInfo.value?.userId}的研讨会`;

  // 房间已在保存时由隐藏 bridge 的 scheduleRoom 创建，
  // 直接用 conference.join() 进入，避免 conference.start() 内部 createRoom 冲突（100010）。
  // 对于未预约的房间（首次直接点进入），join 会失败，此时降级为 start。

  if (scheduleStartTime && scheduleEndTime) {
    // 已预约的房间 → 直接 join
    await conference.join({ roomId, roomType, options: { password } });
  } else {
    // 未预约（即时创建）→ 用 start
    await conference.start({
      roomId,
      roomType,
      options: {
        roomName: roomName || defaultRoomName,
        password,
        isOpenCamera: isOpenCameraParam,
        isOpenMicrophone: isOpenMicrophoneParam,
        isMicrophoneDisableForAllUser,
        isCameraDisableForAllUser,
      },
    });
  }
  notifyParent(ToParentEvent.MEETING_STARTED, { roomId, isHost: true });
}

async function handleJoinConference() {
  await conference.join({
    roomId,
    roomType,
    options: { password },
  });
  notifyParent(ToParentEvent.MEETING_STARTED, {
    roomId,
    isHost: false,
  });
}

async function handleOpenCamera() {
  if (!localVideoQuality.value) {
    updateVideoQuality({ quality: VideoQuality.Quality720P });
  }
  if (getCameraPreference()) {
    try {
      await openLocalCamera();
    } catch (error) {
      handleErrorWithModal(error);
    }
  }
}

async function handleOpenMicrophone() {
  try {
    await muteMicrophone();
    await openLocalMicrophone();
  } catch (error) {
    handleErrorWithModal(error);
  }
  if (getMicrophonePreference()) {
    await unmuteMicrophone();
  }
}

const handleBackHome = () => {
  notifyParent(ToParentEvent.MEETING_ENDED, { roomId });
  // iframe 模式：父窗口（React）会处理跳转；直接访问：带 from=room 标记跳 /home
  router.replace(isInIframe() ? '/home' : '/home?from=room');
};

const handleKickedOut = () => {
  notifyParent(ToParentEvent.USER_KICKED, { roomId });
  router.replace('/home');
};

const handleRoomError = () => {
  notifyParent(ToParentEvent.MEETING_ERROR, { roomId });
  router.replace('/home');
};

onMounted(() => {
  conference.on(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
  conference.on(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
  conference.on(ConferenceRoomEvent.ROOM_ERROR, handleRoomError);
  conference.on(ConferenceRoomEvent.KICKED_OUT, handleKickedOut);
});

onUnmounted(() => {
  conference.off(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
  conference.off(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
  conference.off(ConferenceRoomEvent.ROOM_ERROR, handleRoomError);
  conference.off(ConferenceRoomEvent.KICKED_OUT, handleKickedOut);
  // 组件销毁时清理重试 timer
  if (retryTimer) clearTimeout(retryTimer);
  if (countdownTimer) clearInterval(countdownTimer);
});

</script>

<style lang="scss" scoped>

.waiting-overlay {
  position: fixed;
  inset: 0;
  background: #0d0d0d;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.waiting-card {
  text-align: center;
  color: #fff;
  padding: 40px 48px;
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid #333;
}

.waiting-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 3px solid #333;
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.waiting-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px;
}

.waiting-hint {
  font-size: 13px;
  color: #888;
  margin: 0 0 24px;
}

.waiting-cancel {
  padding: 6px 20px;
  background: transparent;
  border: 1px solid #555;
  border-radius: 6px;
  color: #aaa;
  cursor: pointer;
  font-size: 13px;
  &:hover { border-color: #888; color: #fff; }
}

.room-page {
  width: 100vw;
  height: 100vh;
  min-width: 1150px;
  display: flex;
  flex-direction: row;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  overflow: hidden;
}

.room-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.has-side-panel {
    width: calc(100% - 400px);
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 56px;
  box-sizing: border-box;
  background-color: var(--bg-color-operate);
  border-bottom: 1px solid var(--stroke-color-primary);
  box-shadow: 0 1px 0 var(--uikit-color-black-8);

  &-left {
    display: flex;
    gap: 24px;
    flex: 1;
    justify-content: flex-start;
  }

  &-center {
    flex: 1;
    text-align: center;
    height: 100%;
  }

  &-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    justify-content: flex-end;
  }
}

.room-main {
  min-height: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  background-color: var(--bg-color-topbar);
}

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-color-operate);
  border-top: 1px solid var(--stroke-color-primary);
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 72px;
  bottom: 0;
  left: 0;
  z-index: 1;
  padding: 0px 10px;

  .control-left {
    flex: 1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
  }

  .control-center {
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
    color: var(--text-color-primary);
  }

  .control-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
}

.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  transform: translateX(100%);
  width: 400px;
  height: 100%;
  box-sizing: border-box;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &-visible {
    transform: translateX(0);
  }
}
</style>
