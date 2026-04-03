# CHANGELOG

## 2026-03-27 - 邀请链接支持 Web/客户端双端生成

### 改动背景
用户希望在同一页面直接拿到两类链接：Web 端入会链接和桌面端协议链接，减少手动切换入口或二次拼接参数的操作。

### 已完成
- **邀请区扩展为双端链接** (`src/components/MaterialView/index.tsx`)
  - 保留原有 Web 链接生成逻辑
  - 新增桌面端协议链接生成逻辑（按成员生成 `tencent-meeting://join?...`）
  - 每个成员展示两行链接：`Web` / `客户端`
  - 新增“复制全部 Web”“复制全部客户端”按钮
  - 新增客户端“直接拉起”按钮（通过协议链接尝试唤起桌面端）

- **邀请区样式适配** (`src/components/MaterialView/index.module.less`)
  - 支持单成员多行链接展示
  - 增加链接类型标签、告警文案、按钮样式
  - 调整邀请区头部和列表项布局

### 异常处理
- 客户端协议链接生成失败时：
  - 顶部展示“客户端链接生成失败，请检查当前调试配置”
  - “复制全部客户端”按钮禁用
  - 单条客户端链接保留“正在生成...”占位，避免空白

### 验证结果
- `git diff --check`：通过

## 2026-03-27 - Web/客户端二选一入会入口落地

### 改动背景
当前页面“点击进入”只会唤醒 Electron 客户端，缺少 Web 端和客户端二选一的明确入口；同时，之前删掉的 `/meeting` Web 承接页需要恢复，才能把 Web 入会链路完整打通。

### 已完成
- **恢复 Web 端会议承接路由** (`src/App.tsx`, `src/pages/MeetingPage/index.tsx`, `src/pages/MeetingPage/index.module.less`)
  - 新增 `/meeting` 独立路由，不复用 `MainLayout`
  - 新增全屏 `MeetingPage`，专门承接 `meeting-app` iframe
  - 在 `MeetingPage` 中监听 `MEETING_READY`，下发 `CREATE_MEETING`
  - 监听 `MEETING_ENDED / MEETING_ERROR / USER_KICKED / LOGIN_EXPIRED` 后返回首页

- **扩展 React 主应用会议消息类型** (`src/utils/postMessageBridge.ts`)
  - 增补 `CREATE_MEETING`、`JOIN_MEETING` 指令类型
  - 增补 `MEETING_STARTED`、`MEETING_ENDED` 等回调类型
  - 保持与 `meeting-app` 侧消息枚举对称，避免类型漂移

- **研讨会“点击进入”改为二选一入口** (`src/components/MaterialView/index.tsx`, `src/components/MaterialView/index.module.less`)
  - 新增“入会方式”卡片：`进入 Web 端` / `进入客户端`
  - 默认选择 Web 端，可手动切换到客户端
  - Web 端：跳转 `/meeting` 并携带会议参数
  - 客户端：继续走现有 `launchDesktopMeeting` 唤醒逻辑
  - 主按钮文案随选择项动态变化，和截图中的“二选一”交互一致

### 验证结果
- `git diff --check`：通过
- `npx tsc --noEmit`：未通过，报错为仓库已有问题（`SelectPeople` 的 `.jsx/.js` 缺少类型声明、未使用变量告警）
- `npm run build`：按用户要求不作为本轮阻塞项；此前已观察到该仓库在 `meeting-app vite build` 阶段存在历史性卡住现象

## 2026-03-27 - 研讨会无效配置项清理

### 改动背景
继续排查腾讯预约会议配置后，确认“全体静音 / 全体静画”在已有预约会议再次编辑时不会通过现有 SDK 更新接口生效。另外，页面里的“时区 / 开启摄像头 / 开启麦克风”没有真实落到当前使用链路，属于误导性配置项。

### 已完成
- **限制已有会议的成员管理编辑** (`src/components/MaterialView/index.tsx`)
  - 只要当前研讨会已经有 `roomId`，就禁用“全体静音 / 全体静画”
  - 在控件下方补提示文案：`该配置仅新建会议时生效，修改需重建会议。`

- **删除当前页面里的无效配置项** (`src/components/MaterialView/index.tsx`)
  - 移除“时区”配置项
  - 移除“安全设置 / 房间密码”配置项
  - 移除“开启摄像头”配置项
  - 移除“开启麦克风”配置项
  - 同步移除进入预览页里对应的无效状态展示

- **补充样式** (`src/components/MaterialView/index.module.less`)
  - 新增成员管理禁用提示文案样式
  - 新增预约时间限制说明样式

- **补充时间配置说明** (`src/components/MaterialView/index.tsx`)
  - 在“开始时间 / 会议时长”下方直接展示说明
  - 说明内容为：开始时间必须晚于当前时间，会议时长至少 15 分钟、最长 24 小时
  - 去掉“腾讯”字样、黄色底板和图标，只保留提示文字样式
  - 同时去掉“开始时间 / 会议时长 / 参会成员”标签前的装饰图标，只保留文字
  - 成员管理下的锁定提示也统一改成“说明：...”

- **收口同步提示与保存文案** (`src/components/MaterialView/index.tsx`)
  - “正在同步已预约配置”的提示从按钮下方挪到表单顶部
  - 去掉同步提示里的 `Tencent` 字样
  - 保存成功、保存失败、未登录提示里的 `Tencent` 字样一并去掉
  - 保存中、保存结果、同步中统一成同一套顶部状态条
  - 保存状态优先显示，不再弹全局成功提示
  - 结果态提示改为 2 秒后自动消失，避免常驻

- **补充房间名称限制说明** (`src/components/MaterialView/index.tsx`)
  - 房间名称输入限制为最多 20 字
  - 在输入框下方增加“说明：房间名称最多 20 字。”
  - 必填红星移到标签左侧，和页面其他必填表达保持一致

- **收口表单对齐规则** (`src/components/MaterialView/index.module.less`)
  - 将标签宽度和标签间距提成变量
  - 让分割线和说明文案都跟随同一套对齐规则
  - “全体静音 / 全体静画”改成并排显示

- **重做会议时长选择器** (`src/components/MaterialView/index.tsx`, `src/components/MaterialView/index.module.less`)
  - 不再用单个固定时长下拉
  - 改成“小时 + 分钟”双选择
  - 支持 15 分钟粒度，一直到 24 小时
  - 兼顾了长时段选择场景，避免把 24 小时范围全部塞进一个过长的下拉列表
  - 后续又把单位从下拉内部移到外部，统一成和开始时间一致的 `数字 + 单位` 形式
  - 再进一步把单位收短成 `时 / 分`

- **细化开始时间颗粒度** (`src/components/MaterialView/index.tsx`)
  - 开始时间支持每分钟颗粒度
  - 不再使用超长分钟下拉
  - 改成“小时 + 分钟”双选择，并直接补 `时 / 分` 文案

### 验证结果
- `git diff --check`：待本轮改动后复核

## 2026-03-27 - 腾讯预约会议查询补全与参会人同步修正

### 改动背景
排查腾讯会议 Web 端预约链路时，发现当前页面重新进入已保存会议后，`getScheduledRoomList` 能返回 `roomId` 和房主信息，但拿不到完整的会议密码和参会人列表。同时，已有预约会议再次保存时，参会人和密码不会跟随 `updateScheduledRoom` 一起更新。

### 已完成
- **补全预约会议查询链路** (`meeting-app/src/views/home.vue`)
  - `GET_SCHEDULED_ROOM` 不再只依赖 `getScheduledRoomList`
  - 找到目标房间后，额外调用 `getRoomInfo` 查询密码
  - 额外调用 `getScheduledAttendees` 分页拉全参会人
  - 去掉原来的临时 DEBUG 日志

- **修正已有预约会议再次保存时的增量同步** (`meeting-app/src/views/home.vue`)
  - 房间已存在时，保留原来的 `updateScheduledRoom`
  - 新增 `syncScheduledRoomExtraConfig`
  - 密码改动通过 `updateRoomInfo` 单独同步
  - 参会人改动通过 `addScheduledAttendees` / `removeScheduledAttendees` 单独同步

- **修正联系人选择结果** (`src/components/MaterialView/index.tsx`, `src/components/SelectPeople/index.tsx`)
  - 上层保存时只接收用户实体，不再把部门节点直接当成腾讯参会人
  - 选择部门时，确认提交前自动展开成部门下的具体用户，再交给上层保存

- **补充后端对接文档** (`doc/Tencent 研讨会存储字段设计 - 后端对接.md`)
  - 说明 Tencent 侧该怎么查询会议数据
  - 明确 3 个查询接口分别能返回什么
  - 给出基于现有请求体的 `seminar` 最小扩展方案
  - 明确参会人链接、密码、参会人名称这些字段该如何本地存储
  - 将 3 个查询接口的返回示例改成逐字段中文行内注释，方便后端直接看字段含义
  - 在 `seminar` 模板里进一步标清“必存 / 建议存 / 可不存”字段，便于后端落库裁剪
  - 将顶层元信息和 `seminar` 模板都补成“可直接编码”的存储逻辑注释版
  - 将“3 个接口组合后的推荐用法”改成“当前前端代码里的实际调用逻辑”

### 验证结果
- `git diff --check`：通过
- `npx tsc --noEmit`：未通过，但报错为仓库已有问题，主要是未使用 import 和 `SelectPeople` 目录下 `.jsx/.js` 缺少声明文件
- `cd meeting-app && npx vue-tsc --noEmit`：未通过，现有环境中的 `vue-tsc` 可执行文件损坏，提示 `Cannot find module '../out/proxy'`
- `npm run build`：卡在 `meeting-app` 的 `vite build` 阶段，未拿到结束结果；当前没有证据表明是这次改动引入

### 待关注
- 预约会议的全体静音 / 全体静画配置，在“已有会议再次保存”场景下，SDK 仍没有现成的更新接口
- `meeting-app` 的生产构建耗时异常，建议单独排查现有构建环境
- `SelectPeople` 目录若后续继续走 TypeScript 校验，建议补 `.d.ts` 或迁移为 `.tsx`

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
