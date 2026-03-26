<!--
  home.vue - 等待页
  应用启动后的默认页面，等待 Web 端通过协议唤醒
-->
<template>
  <div class="home-container">
    <div class="waiting-card">
      <div class="logo-area">
        <div class="logo-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="16" fill="#1677ff" />
            <path d="M20 28h24v2H20zM20 34h24v2H20zM20 22h16v2H20z"
                  fill="#fff" opacity="0.9" />
            <rect x="16" y="16" width="32" height="32" rx="4"
                  stroke="#fff" stroke-width="2" fill="none" />
          </svg>
        </div>
        <h1 class="app-title">腾讯会议白板</h1>
      </div>

      <div class="status-area">
        <div class="spinner"></div>
        <p class="status-text">等待会议邀请...</p>
        <p class="hint-text">
          请在 Web 端点击"进入会议"，将自动唤醒本应用
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(async () => {
  // 检查是否有缓存的会议参数（应用通过协议启动但页面还没加载完的情况）
  const pendingParams = await window.electronAPI?.getPendingMeetingParams();
  if (pendingParams) {
    console.log('[Home] 发现缓存的会议参数，直接跳转');
    router.push({
      name: 'room',
      query: {
        roomId: pendingParams.roomId,
        userId: pendingParams.userId,
        userSig: pendingParams.userSig,
        sdkAppId: String(pendingParams.sdkAppId),
        roomName: pendingParams.roomName || '',
      },
    });
  }
});
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.waiting-card {
  text-align: center;
  padding: 48px;
}

.logo-area {
  margin-bottom: 48px;
}

.logo-icon {
  margin-bottom: 16px;
}

.app-title {
  font-size: 28px;
  font-weight: 600;
  color: #e0e0e0;
  letter-spacing: 2px;
}

.status-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* 加载动画 */
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(22, 119, 255, 0.2);
  border-top-color: #1677ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-text {
  font-size: 16px;
  color: #b0b0b0;
}

.hint-text {
  font-size: 13px;
  color: #666;
  max-width: 300px;
  line-height: 1.5;
}
</style>
