<!--
  room.vue - 会议室页面
  接收会议参数，调用 TUIRoomKit 进入会议，集成白板功能
-->
<template>
  <div class="room-container">
    <!-- RoomKit 官方会议界面：不挂这个组件时，即使 join 成功也只会看到空白容器 -->
    <ConferenceMainView v-show="state !== 'error'" class="room-content" />

    <!-- 加载中状态 -->
    <div v-if="state === 'loading'" class="loading-overlay">
      <div class="spinner"></div>
      <p>正在加入会议...</p>
    </div>

    <!-- 错误状态 -->
    <div v-if="state === 'error'" class="error-overlay">
      <p class="error-title">加入会议失败</p>
      <p class="error-msg">{{ errorMsg }}</p>
      <button class="retry-btn" @click="goHome">返回等待页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ConferenceMainView } from '@tencentcloud/roomkit-electron-vue3';

interface RoomKitConference {
  login(params: {
    sdkAppId: number;
    userId: string;
    userSig: string;
  }): Promise<void>;
  join(roomId: string, options?: {
    roomName?: string;
    isOpenWhiteboard?: boolean;
  }): Promise<void>;
  leave(): Promise<void>;
  logout(): Promise<void>;
}

// 页面状态: loading -> joined / error
const state = ref<'loading' | 'joined' | 'error'>('loading');
const errorMsg = ref('');

const route = useRoute();
const router = useRouter();
let cachedConference: RoomKitConference | null = null;
let conferenceLoadingPromise: Promise<RoomKitConference> | null = null;

/**
 * 通过 RoomKit 的 ESM 入口加载桌面端 SDK
 *
 * 这里不能再走 SDK 的 CJS main 入口。
 * 当前版本的 lib 产物里同时存在损坏的 .vue.js 包装文件和 ESM/CJS 混用问题，
 * 所以改成直接加载 es/conference.mjs，再由 vite.config.ts 里的插件把原生依赖重定向回 Electron。
 */
async function getRoomKitConference(): Promise<RoomKitConference> {
  if (cachedConference) {
    return cachedConference;
  }

  if (conferenceLoadingPromise) {
    return conferenceLoadingPromise;
  }

  conferenceLoadingPromise = import('@tencentcloud/roomkit-electron-vue3/es/conference.mjs')
    .then((roomkitModule) => {
      if (!roomkitModule?.conference) {
        throw new Error('腾讯会议 SDK 加载失败，未找到 conference 导出');
      }
      cachedConference = roomkitModule.conference as RoomKitConference;
      return cachedConference;
    })
    .finally(() => {
      conferenceLoadingPromise = null;
    });

  return conferenceLoadingPromise;
}

// 从路由参数中获取会议信息
function getMeetingParams() {
  const { roomId, userId, userSig, sdkAppId, roomName } = route.query;

  if (!roomId || !userId || !userSig || !sdkAppId) {
    return null;
  }

  return {
    roomId: String(roomId),
    userId: String(userId),
    userSig: String(userSig),
    sdkAppId: Number(sdkAppId),
    roomName: roomName ? String(roomName) : undefined,
  };
}

/**
 * 加入会议的核心流程:
 * 1. 登录 TUIRoomKit（使用 sdkAppId + userId + userSig）
 * 2. 加入会议房间（使用 roomId）
 *
 * 注意: @tencentcloud/roomkit-electron-vue3 的 API 可能需要根据实际版本调整
 */
async function joinMeeting() {
  const params = getMeetingParams();
  if (!params) {
    state.value = 'error';
    errorMsg.value = '缺少必要的会议参数，请从 Web 端重新进入';
    return;
  }

  try {
    const conference = await getRoomKitConference();

    // 第一步: 登录
    await conference.login({
      sdkAppId: params.sdkAppId,
      userId: params.userId,
      userSig: params.userSig,
    });
    console.log('[Room] TUIRoomKit 登录成功');

    // 第二步: 加入会议
    await conference.join(params.roomId, {
      roomName: params.roomName,
      // 默认开启白板
      isOpenWhiteboard: true,
    });
    console.log('[Room] 加入会议成功, roomId:', params.roomId);

    state.value = 'joined';
  } catch (err: any) {
    console.error('[Room] 加入会议失败:', err);
    state.value = 'error';
    errorMsg.value = err?.message || '未知错误，请重试';
  }
}

/** 返回等待页 */
function goHome() {
  router.push({ name: 'home' });
}

onMounted(() => {
  joinMeeting();
});

onBeforeUnmount(async () => {
  // 离开页面时退出会议，释放资源
  try {
    if (cachedConference) {
      await cachedConference.leave();
      await cachedConference.logout();
    }
    console.log('[Room] 已退出会议并登出');
  } catch (err) {
    console.warn('[Room] 退出会议时出错:', err);
  }
});
</script>

<style scoped>
.room-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #1a1a2e;
}

.room-content {
  width: 100%;
  height: 100%;
}

/* 加载中 */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #1a1a2e;
  z-index: 100;
  color: #b0b0b0;
  font-size: 15px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(22, 119, 255, 0.2);
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #1a1a2e;
  z-index: 100;
}

.error-title {
  font-size: 18px;
  color: #e0e0e0;
  font-weight: 600;
}

.error-msg {
  font-size: 14px;
  color: #999;
  max-width: 400px;
  text-align: center;
  line-height: 1.5;
}

.retry-btn {
  margin-top: 8px;
  padding: 8px 24px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #4096ff;
}
</style>
