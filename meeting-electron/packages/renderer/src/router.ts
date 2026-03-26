/**
 * 路由配置
 * home: 等待会议邀请页
 * room: 会议室页面
 */

import { createRouter, createWebHashHistory } from 'vue-router';

export const router = createRouter({
  // Electron 环境用 hash 模式，避免文件路径问题
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/home.vue'),
    },
    {
      path: '/room',
      name: 'room',
      component: () => import('./views/room.vue'),
    },
  ],
});
