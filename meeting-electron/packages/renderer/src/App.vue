<!--
  App.vue - 应用根组件
  提供路由出口，负责监听主进程发来的会议参数并跳转到会议室
-->
<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // 监听主进程通过协议唤醒发来的会议参数
  window.electronAPI?.onMeetingJoin((params) => {
    console.log('[App] 收到会议参数，跳转到会议室:', params.roomId);
    router.push({
      name: 'room',
      query: {
        roomId: params.roomId,
        userId: params.userId,
        userSig: params.userSig,
        sdkAppId: String(params.sdkAppId),
        roomName: params.roomName || '',
      },
    });
  });
});
</script>

<style>
/* 全局样式重置 */
#app {
  width: 100%;
  height: 100%;
}
</style>
