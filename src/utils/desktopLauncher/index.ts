/**
 * 桌面端会议应用启动器
 *
 * 两种通信方式：
 * 1. HTTP 桥接（开发模式优先）: 通过本地 HTTP 服务直接给已运行的 Electron 传参
 * 2. 协议跳转（生产模式）: 通过 tencent-meeting:// 自定义协议唤醒 Electron
 */
import { genTestUserSig } from '@/debug/generateTestUserSig';

export interface LaunchOptions {
  /** 当前用户的 memberId（雪花 ID） */
  memberId: string;
  /** 会议房间 ID */
  roomId: string;
  /** 房间名称（可选） */
  roomName?: string;
}

// Electron 主进程桥接服务端口（与 meeting-electron/packages/main/index.ts 中一致）
const DEV_BRIDGE_PORT = 17580;
const BRIDGE_BASE = `http://127.0.0.1:${DEV_BRIDGE_PORT}`;

/**
 * 检测桌面端是否在线（通过 HTTP 桥接服务的 /ping 接口）
 */
async function isDesktopOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${BRIDGE_BASE}/ping`, {
      method: 'GET',
      signal: AbortSignal.timeout(1000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 通过 HTTP 桥接服务发送会议参数给 Electron
 */
async function launchViaBridge(params: {
  roomId: string;
  userId: string;
  userSig: string;
  sdkAppId: number;
  roomName?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${BRIDGE_BASE}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return data?.success === true;
  } catch {
    return false;
  }
}

/**
 * 通过协议 URL 唤醒桌面端（生产模式下使用）
 */
function launchViaProtocol(params: {
  roomId: string;
  userId: string;
  userSig: string;
  sdkAppId: number;
  roomName?: string;
}): void {
  const searchParams = new URLSearchParams({
    roomId: params.roomId,
    userId: params.userId,
    userSig: params.userSig,
    sdkAppId: String(params.sdkAppId),
  });
  if (params.roomName) {
    searchParams.set('roomName', params.roomName);
  }

  const url = `tencent-meeting://join?${searchParams.toString()}`;

  // 用隐藏 iframe 触发协议跳转
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  setTimeout(() => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }, 2000);
}

/**
 * 启动桌面端会议应用
 *
 * 策略：先尝试 HTTP 桥接（桌面端已运行），失败则走协议跳转（唤醒桌面端）。
 * 如果都失败，抛出 DESKTOP_NOT_INSTALLED 错误。
 */
export async function launchDesktopMeeting(options: LaunchOptions) {
  // 生成 TRTC 鉴权所需的 userId 和 userSig
  const { sdkAppId, userId, userSig } = await genTestUserSig(options.memberId);

  const meetingParams = {
    roomId: options.roomId,
    userId,
    userSig,
    sdkAppId,
    roomName: options.roomName,
  };

  // 优先通过 HTTP 桥接（桌面端已运行时直接传参，最可靠）
  const online = await isDesktopOnline();
  if (online) {
    console.log('[desktopLauncher] 桌面端在线，通过 HTTP 桥接发送参数');
    const success = await launchViaBridge(meetingParams);
    if (success) return;
    console.warn('[desktopLauncher] HTTP 桥接发送失败，回退到协议跳转');
  }

  // 回退到协议跳转（尝试唤醒桌面端）
  console.log('[desktopLauncher] 尝试协议跳转唤醒桌面端');
  launchViaProtocol(meetingParams);

  // 等一下再检查桌面端是否响应了
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const nowOnline = await isDesktopOnline();
  if (nowOnline) {
    // 协议唤醒成功，再通过 HTTP 发一次参数（协议跳转可能没带参数）
    await launchViaBridge(meetingParams);
    return;
  }

  // 都失败了，桌面端可能没安装
  throw new Error('DESKTOP_NOT_INSTALLED');
}
