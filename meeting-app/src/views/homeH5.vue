<template>
  <div v-if="isEmbedded" class="embedded-waiting"></div>
  <PreConferenceViewH5
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
import { PreConferenceViewH5 } from '@tencentcloud/roomkit-web-vue3';
import { useRouter } from 'vue-router';
import { useMediaPreference } from '../hooks/useMediaPreference';
import { isInIframe, notifyParent, onParentMessage, ToParentEvent, ToChildEvent } from '../utils/postMessageBridge';
import type { CreateMeetingPayload } from '../utils/postMessageBridge';

const isEmbedded = isInIframe();

const { setCameraPreference, setMicrophonePreference } = useMediaPreference();
const router = useRouter();

const handleCameraPreferenceChange = (isOpen: boolean) => { setCameraPreference(isOpen); };
const handleMicrophonePreferenceChange = (isOpen: boolean) => { setMicrophonePreference(isOpen); };
const handleLogout = () => { router.push('/login'); };

const handleCreateRoom = async (roomId: string) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'true');
  router.push({ path: '/room', query: { roomId } });
};

const handleJoinRoom = async (roomId: string) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'false');
  router.push({ path: '/room', query: { roomId } });
};

let cleanupListener: (() => void) | null = null;

onMounted(() => {
  notifyParent(ToParentEvent.MEETING_READY);
  cleanupListener = onParentMessage<CreateMeetingPayload>(ToChildEvent.CREATE_MEETING, (data) => {
    handleCreateRoom(data.roomId);
  });
});

onUnmounted(() => { cleanupListener?.(); });
</script>

<style lang="scss" scoped>
.embedded-waiting {
  width: 100vw;
  height: 100vh;
  background: #000;
}
</style>
