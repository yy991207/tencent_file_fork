<template>
  <!-- 有 userId 时静默自动登录，不展示任何表单 -->
  <div v-if="autoLoggingIn" class="login-loading"></div>
  <div v-else class="login-container">
    <Login
      class="login-widget"
      v-bind="{
        SDKAppID: SDKAPPID,
        generatorUserSig: genTestUserSig,
        onLoginCallback: handleLogin
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useLoginState, useRoomModal } from 'tuikit-atomicx-vue3/room';
import { useRouter, useRoute } from 'vue-router';
import Login from '../components/LoginUserID/index.vue';
import { SDKAPPID, genTestUserSig } from '../config/basic-info-config';

const { login } = useLoginState();
const { handleErrorWithModal } = useRoomModal();
const router = useRouter();
const route = useRoute();

// URL 里有 userId（来自房间链接或 React 传入）时才自动登录
const urlUserId = route.query.userId as string | undefined;
const autoLoggingIn = ref(!!urlUserId);

onMounted(async () => {
  if (!urlUserId) return;
  try {
    const userSig = genTestUserSig(urlUserId);
    await login({ userId: urlUserId, userSig, sdkAppId: SDKAPPID });
    localStorage.setItem('tuiRoom-userInfo', JSON.stringify({ SDKAppID: SDKAPPID, userID: urlUserId, userSig }));
    router.push((route.query.redirect as string) || '/home');
  } catch (error: any) {
    console.error('[Meeting] 自动登录失败，降级到手动输入', error);
    autoLoggingIn.value = false;
  }
});

/** 手动输入表单回调（无 userId 时的兜底） */
const handleLogin = async (userInfo: {
  SDKAppID: number;
  userID: string;
  userSig: string;
}) => {
  try {
    await login({ userId: userInfo.userID, userSig: userInfo.userSig, sdkAppId: userInfo.SDKAppID });
    localStorage.setItem('tuiRoom-userInfo', JSON.stringify(userInfo));
    router.push((route.query.redirect as string) || '/home');
  } catch (error: any) {
    console.error('Login failed:', error.code);
    handleErrorWithModal(error);
  }
};
</script>

<style scoped>
.login-loading {
  width: 100%;
  height: 100%;
  background: #000;
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: url('../assets/background-black.png') no-repeat center center;
  background-color: black;
  background-size: cover;

  @media screen and (orientation: portrait), (orientation: landscape) {
    :deep(.phone-prefix) {
      min-width: 30px;
    }
  }
}
</style>
