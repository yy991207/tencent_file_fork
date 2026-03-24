<template>
  <!-- iframe 嵌入模式：不渲染 PreConferenceView，避免过渡闪烁 -->
  <div v-if="isEmbedded" class="embedded-waiting"></div>
  <!-- 直接访问 + 从会议室退出：显示「已离开」提示 -->
  <div v-else-if="leftRoom" class="left-room">
    <div class="left-room-card">
      <div class="left-room-icon">✓</div>
      <p class="left-room-title">已离开会议</p>
      <p class="left-room-hint">您可以安全关闭此页面</p>
    </div>
  </div>
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
import { useRouter, useRoute } from 'vue-router';
import { useLoginState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { useMediaPreference } from '../hooks/useMediaPreference';
import type { TUIRoomType } from 'tuikit-atomicx-vue3/room';
import { isInIframe, notifyParent, onParentMessage, ToParentEvent, ToChildEvent } from '../utils/postMessageBridge';
import type { CreateMeetingPayload, ScheduleRoomPayload, GetScheduledRoomPayload } from '../utils/postMessageBridge';
import { SDKAPPID, genTestUserSig } from '../config/basic-info-config';

const isEmbedded = isInIframe();
const route = useRoute();
/** 从会议室退出后回到 /home，显示「已离开」而非 PreConferenceView */
const leftRoom = !isEmbedded && route.query.from === 'room';

const router = useRouter();
const { login } = useLoginState();
const { scheduleRoom, getScheduledRoomList } = useRoomState();

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

const handleCreateRoom = async (roomId: string, roomType: TUIRoomType, options?: { userId?: string; roomName?: string; password?: string; isOpenCamera?: boolean; isOpenMicrophone?: boolean; isMicrophoneDisableForAllUser?: boolean; isCameraDisableForAllUser?: boolean; scheduleStartTime?: number; scheduleEndTime?: number; scheduleAttendees?: string[] }) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'true');
  router.push({
    path: '/room',
    query: {
      roomId,
      roomType,
      ...(options?.userId    && { userId: options.userId }),
      ...(options?.roomName  && { roomName: options.roomName }),
      ...(options?.password  && { password: options.password }),
      isOpenCamera: String(options?.isOpenCamera ?? true),
      isOpenMicrophone: String(options?.isOpenMicrophone ?? true),
      isMicrophoneDisableForAllUser: String(options?.isMicrophoneDisableForAllUser ?? false),
      isCameraDisableForAllUser: String(options?.isCameraDisableForAllUser ?? false),
      ...(options?.scheduleStartTime && { scheduleStartTime: String(options.scheduleStartTime) }),
      ...(options?.scheduleEndTime && { scheduleEndTime: String(options.scheduleEndTime) }),
      ...(options?.scheduleAttendees?.length && { scheduleAttendees: options.scheduleAttendees.join(',') }),
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
let cleanupScheduleListener: (() => void) | null = null;
let cleanupGetConfigListener: (() => void) | null = null;

/** 确保登录（iframe 模式下自动完成） */
async function ensureLogin(userId?: string): Promise<void> {
  if (!isEmbedded || !userId) return;
  if (localStorage.getItem('tuiRoom-userInfo')) return;
  const userSig = genTestUserSig(userId);
  await login({ userId, userSig, sdkAppId: SDKAPPID });
  localStorage.setItem('tuiRoom-userInfo', JSON.stringify({
    SDKAppID: SDKAPPID, userID: userId, userSig,
  }));
}

onMounted(() => {
  // 通知 React 父窗口：Vue 应用已就绪，可以下发指令
  notifyParent(ToParentEvent.MEETING_READY);

  // ── 发起会议 ──
  cleanupListener = onParentMessage<CreateMeetingPayload>(ToChildEvent.CREATE_MEETING, async (data) => {
    try {
      await ensureLogin(data.userId);
    } catch (e) {
      console.error('[Meeting] 自动登录失败', e);
    }
    handleCreateRoom(data.roomId, (data.roomType ?? 1) as TUIRoomType, {
      userId: data.userId,
      roomName: data.roomName,
      password: data.password,
      isOpenCamera: data.isOpenCamera,
      isOpenMicrophone: data.isOpenMicrophone,
      isMicrophoneDisableForAllUser: data.isMicrophoneDisableForAllUser,
      isCameraDisableForAllUser: data.isCameraDisableForAllUser,
      scheduleStartTime: data.scheduleStartTime,
      scheduleEndTime: data.scheduleEndTime,
      scheduleAttendees: data.scheduleAttendees,
    });
  });

  // ── 保存时预约房间（不进入会议） ──
  cleanupScheduleListener = onParentMessage<ScheduleRoomPayload>(ToChildEvent.SCHEDULE_ROOM, async (data) => {
    try {
      await ensureLogin(data.userId);
      await scheduleRoom({
        roomId: data.roomId,
        options: {
          roomName: data.roomName,
          password: data.password,
          scheduleStartTime: data.scheduleStartTime,
          scheduleEndTime: data.scheduleEndTime,
          scheduleAttendees: data.scheduleAttendees,
          isAllMicrophoneDisabled: data.isAllMicrophoneDisabled,
          isAllCameraDisabled: data.isAllCameraDisabled,
        },
      });
      notifyParent(ToParentEvent.ROOM_SCHEDULED, { roomId: data.roomId, success: true });
    } catch (error: any) {
      console.error('[Meeting] scheduleRoom 失败', error);
      notifyParent(ToParentEvent.ROOM_SCHEDULED, {
        roomId: data.roomId,
        success: false,
        error: error?.message ?? 'scheduleRoom failed',
      });
    }
  });

  // ── 查询已预约房间配置 ──
  cleanupGetConfigListener = onParentMessage<GetScheduledRoomPayload>(ToChildEvent.GET_SCHEDULED_ROOM, async (data) => {
    try {
      // 分页查询，找到匹配 roomId 的房间
      let cursor = '';
      let found = false;
      do {
        const result = await getScheduledRoomList({ cursor });
        const room = result.scheduledRoomList.find(r => r.roomId === data.roomId);
        if (room) {
          found = true;
          notifyParent(ToParentEvent.SCHEDULED_ROOM_CONFIG, {
            roomId: data.roomId,
            roomName: room.roomName,
            found: true,
            // ScheduleRoomOptions 字段由 room 上读取（SDK 返回 conferenceInfo）
            scheduleStartTime: (room as any).conferenceInfo?.scheduleStartTime,
            scheduleEndTime: (room as any).conferenceInfo?.scheduleEndTime,
            scheduleAttendees: (room as any).conferenceInfo?.scheduleAttendees,
            isAllMicrophoneDisabled: (room as any).conferenceInfo?.isAllMicrophoneDisabled,
            isAllCameraDisabled: (room as any).conferenceInfo?.isAllCameraDisabled,
          });
          break;
        }
        cursor = result.cursor;
      } while (cursor);

      if (!found) {
        notifyParent(ToParentEvent.SCHEDULED_ROOM_CONFIG, { roomId: data.roomId, found: false });
      }
    } catch (error) {
      console.error('[Meeting] getScheduledRoomList 失败', error);
      notifyParent(ToParentEvent.SCHEDULED_ROOM_CONFIG, { roomId: data.roomId, found: false });
    }
  });
});

onUnmounted(() => {
  cleanupListener?.();
  cleanupScheduleListener?.();
  cleanupGetConfigListener?.();
});
</script>

<style lang="scss" scoped>
.embedded-waiting {
  width: 100vw;
  height: 100vh;
  background: #000;
}

.left-room {
  width: 100vw;
  height: 100vh;
  background: #0d0d0d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-room-card {
  text-align: center;
  color: #fff;
  padding: 48px 56px;
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid #2a2a2a;
}

.left-room-icon {
  width: 56px;
  height: 56px;
  line-height: 56px;
  font-size: 28px;
  margin: 0 auto 20px;
  background: #1677ff22;
  border-radius: 50%;
  color: #1677ff;
}

.left-room-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px;
}

.left-room-hint {
  font-size: 13px;
  color: #666;
  margin: 0;
}
</style>
