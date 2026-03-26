/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// TUIRoomKit 模块声明（实际类型由包自带，这里做兜底）
declare module '@tencentcloud/roomkit-electron-vue3' {
  export const conference: {
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
  };
}
