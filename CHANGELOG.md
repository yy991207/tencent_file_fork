# CHANGELOG

## 2026-03-25 - 会议白板功能开发（阶段一+二）

### 改动背景
将"入会"流程从 Web iframe 切换为 Electron 桌面端，引入互动白板能力。Web SDK 不支持白板，Electron SDK 内置白板功能。

### 已完成

#### Web 端改造（阶段二 -- 全部完成）
- **新增 desktopLauncher 模块** (`src/utils/desktopLauncher/index.ts`)
  - 双通道策略：优先 HTTP 桥接（端口 17580），失败回退协议跳转
  - 调用 `genTestUserSig()` 生成鉴权信息
  - 桌面端未安装时 message.warning 提示

- **迁移 postMessageBridge** (`src/utils/postMessageBridge.ts`)
  - 从 `src/pages/MeetingPage/` 迁移到 `src/utils/`
  - 移除入会相关类型（CREATE_MEETING、JOIN_MEETING 等）
  - 保留预约/查询相关类型（SCHEDULE_ROOM、GET_SCHEDULED_ROOM 等）

- **修改 MaterialView handleStartLive** (`src/components/MaterialView/index.tsx`)
  - `navigate('/meeting?...')` 改为 `await launchDesktopMeeting()`
  - 添加 try/catch 错误处理，区分 DESKTOP_NOT_INSTALLED 和其他错误

- **删除 MeetingPage**
  - 移除 `src/pages/MeetingPage/` 整个目录
  - 移除 `App.tsx` 中 `/meeting` 路由和 import

- **更新 import 路径**
  - `tencentMeetingBridge.ts` 和 `TencentMeetingBridge/index.tsx` 的 import 已更新

#### Electron 桌面端搭建（阶段一 -- 结构完成，SDK 加载待调通）
- **主进程** (`packages/main/`)
  - 协议注册：`tencent-meeting://`
  - 单实例锁（macOS + Windows）
  - HTTP 桥接服务（端口 17580，解决开发模式协议注册不可靠问题）
  - 协议 URL 解析与参数分发
  - 白板窗口管理（独立窗口 + 标注窗口）

- **渲染进程** (`packages/renderer/`)
  - home.vue: 等待页，检测缓存的会议参数
  - room.vue: 会议室页面，自动 login -> join
  - 路由配置（vue-router）

- **预加载脚本** (`packages/preload/`)
  - electronAPI 挂载（会议参数、白板控制、应用退出）

- **打包配置** (`electron-builder.yml`)
  - macOS: dmg + zip，Windows: nsis
  - 协议注册自动写入

### 验证结果
- Web 端 TypeScript 类型检查：本次改动零新增错误
- MeetingPage 残留引用：零
- 预约功能代码完整保留
- Web -> Electron 参数传递：HTTP 桥接已跑通（控制台可见"收到会议参数"）

### 当前阻塞
- 腾讯云 RoomKit Electron SDK 与 Vite 模块解析不兼容（CJS/ESM + .node 原生模块）
- 最新方案：nodeIntegration: true + 全部排除，待验证
- 备选方案：切换到 webpack（官方示例使用 webpack）

### 踩坑记录
| 问题 | 解决 |
|------|------|
| roomkit-electron-vue3@5.4.3 不存在 | NPM 最新版是 3.2.4 |
| pinia 版本冲突 | 锁定 2.0.24 + --legacy-peer-deps |
| Electron 默认欢迎页 | 启动时加 NODE_ENV=development |
| macOS 协议跳转打开裸 Electron | 改用 HTTP 桥接服务 |
| @tencentcloud/chat CJS/ESM 不兼容 | 进行中 |

### 待办
- [ ] 解决 SDK 加载兼容性问题（Vite 或切 webpack）
- [ ] 跑通入会流程：login -> join -> 进入会议室
- [ ] 验证白板功能
- [ ] 全流程联调
- [ ] electron-builder 打包
- [ ] macOS/Windows 兼容性测试
