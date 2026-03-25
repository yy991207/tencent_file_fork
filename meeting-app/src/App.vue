<template>
  <UIKitProvider :theme="initialTheme" :language="initialLanguage">
    <div id="app">
      <router-view />
    </div>
  </UIKitProvider>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoomInvitation, useRoomInvitationH5 } from '@tencentcloud/roomkit-web-vue3';
import { TUIMessageBox, UIKitProvider, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState, useRoomModal, LoginEvent } from 'tuikit-atomicx-vue3/room';
import { useRoute, useRouter } from 'vue-router';
import { isPC } from './utils/utils';
import { isInIframe } from './utils/postMessageBridge';

const { t } = useUIKit();
const initialTheme = ref(localStorage.getItem('tuiRoom-theme') || 'light');
const initialLanguage = ref(localStorage.getItem('tuiRoom-language') || '');

const router = useRouter();
const route = useRoute();
const { login, subscribeEvent, unSubscribeEvent } = useLoginState();
const { handleErrorWithModal } = useRoomModal();

useRoomInvitation({
  onAcceptCall: (params) => {
    router.push({
      path: '/room',
      query: params,
    });
  },
});

if (!isPC) {
  useRoomInvitationH5({
    onAcceptCall: (params) => {
      router.push({
        path: '/room',
        query: params,
      });
    },
  });
} else {
  useRoomInvitation({
    onAcceptCall: (params) => {
      router.push({
        path: '/room',
        query: params,
      });
    },
  });
}

const onLoginExpired = () => {
  TUIMessageBox.alert({
    title: t('Login.Expired'),
    content: t('Login.ExpiredDescription'),
  });
  router.replace({ path: '/login' });
};
const onKickedOffline = () => {
  TUIMessageBox.alert({
    title: t('Login.KickedOffline'),
    content: t('Login.KickedOfflineDescription'),
  });
  router.replace({ path: '/login' });
};
const bindEvent = () => {
  subscribeEvent(LoginEvent.onLoginExpired, onLoginExpired);
  subscribeEvent(LoginEvent.onKickedOffline, onKickedOffline);
};
const unbindEvent = () => {
  unSubscribeEvent(LoginEvent.onLoginExpired, onLoginExpired);
  unSubscribeEvent(LoginEvent.onKickedOffline, onKickedOffline);
};

onMounted(async () => {
  bindEvent();
  await router.isReady();
  if (route.path === '/login') {
    return;
  }
  // iframe 嵌入模式跳过自动登录检查，由 home.vue 的 ensureLogin 按需处理
  if (isInIframe()) {
    return;
  }
  const storedData = localStorage.getItem('tuiRoom-userInfo') || '{}';
  const userInfo = JSON.parse(storedData);
  // 校验必要字段，缺失则直接跳登录页，避免 SDK 创建失败
  if (!userInfo.SDKAppID || !userInfo.userID || !userInfo.userSig) {
    localStorage.removeItem('tuiRoom-userInfo');
    router.replace({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }
  try {
    await login({
      userId: userInfo.userID,
      userSig: userInfo.userSig,
      sdkAppId: Number(userInfo.SDKAppID),
    });
  } catch (error: any) {
    console.error('Login failed:', error);
    handleErrorWithModal(error);
    localStorage.removeItem('tuiRoom-userInfo');
    router.replace({ path: '/login', query: { redirect: route.fullPath } });
  }
});

onUnmounted(() => {
  unbindEvent();
});

</script>

<style lang="scss">
@use './styles/base.scss';
</style>
