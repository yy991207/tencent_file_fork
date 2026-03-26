/**
 * 协议解析模块
 * 负责解析 tencent-meeting:// 协议 URL，提取会议参数
 */

export interface MeetingParams {
  roomId: string;
  userId: string;
  userSig: string;
  sdkAppId: number;
  roomName?: string;
}

/**
 * 解析 deep link URL，提取会议参数
 * 格式: tencent-meeting://join?roomId=xxx&userId=xxx&userSig=xxx&sdkAppId=xxx&roomName=xxx
 */
export function parseDeepLink(url: string): MeetingParams | null {
  try {
    // 兼容不同格式的协议 URL
    // tencent-meeting://join?key=value 或 tencent-meeting://join/?key=value
    const normalized = url.replace('tencent-meeting://', 'https://meeting.local/');
    const parsed = new URL(normalized);
    const params = parsed.searchParams;

    const roomId = params.get('roomId');
    const userId = params.get('userId');
    const userSig = params.get('userSig');
    const sdkAppIdStr = params.get('sdkAppId');

    // 必填参数校验
    if (!roomId || !userId || !userSig || !sdkAppIdStr) {
      console.error('[DeepLink] 缺少必填参数，需要 roomId/userId/userSig/sdkAppId');
      return null;
    }

    const sdkAppId = parseInt(sdkAppIdStr, 10);
    if (isNaN(sdkAppId)) {
      console.error('[DeepLink] sdkAppId 必须是数字');
      return null;
    }

    return {
      roomId,
      userId,
      userSig,
      sdkAppId,
      roomName: params.get('roomName') || undefined,
    };
  } catch (err) {
    console.error('[DeepLink] URL 解析失败:', err);
    return null;
  }
}
