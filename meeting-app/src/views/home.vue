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
const {
  scheduleRoom,
  updateScheduledRoom,
  cancelScheduledRoom,
  getScheduledRoomList,
  getScheduledAttendees,
  addScheduledAttendees,
  removeScheduledAttendees,
  updateRoomInfo,
  getRoomInfo,
} = useRoomState();

// 当前 iframe 会话是否已完成 SDK 登录（localStorage 有数据不代表 SDK 已登录）
let sessionLoggedIn = false;

const { setMicrophonePreference, setCameraPreference } = useMediaPreference();

function normalizeAttendeeIds(attendees?: string[]): string[] {
  return [...new Set((attendees ?? []).filter(Boolean))];
}

/**
 * 腾讯把预约参会人做成了独立分页接口，这里统一拉全，避免只取到第一页数据。
 */
async function fetchAllScheduledAttendeeIds(roomId: string): Promise<string[]> {
  let cursor = '0';
  const attendeeIds: string[] = [];

  do {
    const result = await getScheduledAttendees({ roomId, cursor });
    attendeeIds.push(...result.attendees.map(user => user.userId).filter(Boolean));
    cursor = result.cursor;
  } while (cursor !== '');

  return [...new Set(attendeeIds)];
}

/**
 * 已有预约房间再次保存时，时间和名称走 update 接口；
 * 密码和参会人要额外补独立接口，否则腾讯侧不会真正更新。
 */
async function syncScheduledRoomExtraConfig(
  roomId: string,
  options: { password?: string; scheduleAttendees?: string[] },
): Promise<void> {
  const nextPassword = options.password ?? '';
  const nextAttendeeIds = normalizeAttendeeIds(options.scheduleAttendees);
  const roomInfo = await getRoomInfo({ roomId });

  if ((roomInfo.password ?? '') !== nextPassword) {
    await updateRoomInfo({
      roomId,
      options: { password: nextPassword },
    });
  }

  const currentAttendeeIds = await fetchAllScheduledAttendeeIds(roomId);
  const attendeesToAdd = nextAttendeeIds.filter(userId => !currentAttendeeIds.includes(userId));
  const attendeesToRemove = currentAttendeeIds.filter(userId => !nextAttendeeIds.includes(userId));

  if (attendeesToAdd.length > 0) {
    await addScheduledAttendees({ roomId, userIdList: attendeesToAdd });
  }

  if (attendeesToRemove.length > 0) {
    await removeScheduledAttendees({ roomId, userIdList: attendeesToRemove });
  }
}

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
  if (sessionLoggedIn) return;
  const userSig = genTestUserSig(userId);
  await login({ userId, userSig, sdkAppId: SDKAPPID });
  sessionLoggedIn = true;
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
    const roomOptions = {
      roomName: data.roomName,
      password: data.password,
      scheduleStartTime: data.scheduleStartTime,
      scheduleEndTime: data.scheduleEndTime,
      scheduleAttendees: data.scheduleAttendees,
      isAllMicrophoneDisabled: data.isAllMicrophoneDisabled,
      isAllCameraDisabled: data.isAllCameraDisabled,
    };
    try {
      await ensureLogin(data.userId);
      try {
        await scheduleRoom({ roomId: data.roomId, options: roomOptions });
      } catch (scheduleError: any) {
        const code = scheduleError?.errorCode ?? scheduleError?.code;
        if (code === 100010) {
          // 房间已存在 → 尝试 update
          console.info('[Meeting] 房间已存在，尝试 updateScheduledRoom', data.roomId);
          try {
            await updateScheduledRoom({ roomId: data.roomId, options: roomOptions });
            await syncScheduledRoomExtraConfig(data.roomId, roomOptions);
          } catch (updateError: any) {
            const updateCode = updateError?.errorCode ?? updateError?.code;
            if (updateCode === 100006) {
              // 房间已启动过，无法 update → 先取消再重建
              console.info('[Meeting] 房间已启动过，先 cancel 再重新 schedule', data.roomId);
              await cancelScheduledRoom({ roomId: data.roomId });
              // 腾讯 SDK 限流：cancel 后需等待 ≥1 秒才能重新 schedule（error 100012）
              await new Promise(resolve => setTimeout(resolve, 1500));
              await scheduleRoom({ roomId: data.roomId, options: roomOptions });
            } else {
              throw updateError;
            }
          }
        } else {
          throw scheduleError;
        }
      }
      notifyParent(ToParentEvent.ROOM_SCHEDULED, {
        requestId: data.requestId,
        roomId: data.roomId,
        success: true,
      });
    } catch (error: any) {
      console.error('[Meeting] scheduleRoom/updateScheduledRoom 失败', error);
      notifyParent(ToParentEvent.ROOM_SCHEDULED, {
        requestId: data.requestId,
        roomId: data.roomId,
        success: false,
        error: error?.message ?? 'scheduleRoom failed',
      });
    }
  });

  // ── 查询已预约房间配置 ──
  cleanupGetConfigListener = onParentMessage<GetScheduledRoomPayload>(ToChildEvent.GET_SCHEDULED_ROOM, async (data) => {
    try {
      await ensureLogin(data.userId);
      // 分页查询，找到匹配 roomId 的房间
      let cursor = '';
      let found = false;
      do {
        const result = await getScheduledRoomList({ cursor });
        const room = result.scheduledRoomList.find(r => r.roomId === data.roomId);
        if (room) {
          const [roomInfo, attendeeIds] = await Promise.all([
            getRoomInfo({ roomId: data.roomId }),
            fetchAllScheduledAttendeeIds(data.roomId),
          ]);
          found = true;
          const payload = {
            requestId: data.requestId,
            roomId: data.roomId,
            roomName: room.roomName,
            found: true,
            password: roomInfo.password ?? room.password,
            scheduleStartTime: room.scheduledStartTime,
            scheduleEndTime: room.scheduledEndTime,
            scheduleAttendees: attendeeIds,
            isAllMicrophoneDisabled: roomInfo.isAllMicrophoneDisabled ?? room.isAllMicrophoneDisabled,
            isAllCameraDisabled: roomInfo.isAllCameraDisabled ?? room.isAllCameraDisabled,
          };
          // [DEBUG] 查看最终回传给 React 的数据结构
          console.log('[DEBUG] SCHEDULED_ROOM_CONFIG 回传 payload:', JSON.stringify(payload, null, 2));
          notifyParent(ToParentEvent.SCHEDULED_ROOM_CONFIG, payload);
          break;
        }
        cursor = result.cursor;
      } while (cursor);

      if (!found) {
        notifyParent(ToParentEvent.SCHEDULED_ROOM_CONFIG, {
          requestId: data.requestId,
          roomId: data.roomId,
          found: false,
        });
      }
    } catch (error) {
      console.error('[Meeting] getScheduledRoomList 失败', error);
      notifyParent(ToParentEvent.SCHEDULED_ROOM_CONFIG, {
        requestId: data.requestId,
        roomId: data.roomId,
        found: false,
      });
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
