/**
 * 渲染进程入口
 * 初始化 Vue 应用、路由、状态管理
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount('#app');
