/**
 * 仅供调试使用，严禁上线
 *
 * 在前端用 SecretKey 生成 UserSig，适合本地联调阶段快速跑通。
 * 正式上线前必须迁移到服务端生成（SecretKey 暴露在客户端会被逆向）。
 *
 * 算法来源：腾讯云 TLS 签名 v2
 * https://cloud.tencent.com/document/product/647/17275
 *
 * SDKAppID / SecretKey 在构建时由 vite.config.ts 从 config.yaml 读取并注入，
 * 源码中不写任何明文。
 */

// 由 vite.config.ts define 注入，值来自 config.yaml
declare const __TRTC_SDK_APP_ID__: number;
declare const __TRTC_SECRET_KEY__: string;

const TRTC_SDK_APP_ID  = __TRTC_SDK_APP_ID__;
const TRTC_SECRET_KEY  = __TRTC_SECRET_KEY__;
const EXPIRE_SECONDS   = 604800; // 默认有效期 7 天

export interface UserSigResult {
  sdkAppId: number;
  userId: string;
  userSig: string;
}

/**
 * 生成测试用 UserSig
 * @param memberId - list 接口返回的 memberId（纯数字雪花 ID）
 *
 * TRTC userId 规则：字母/数字/下划线/连字符，禁止纯数字。
 * 因此自动在 memberId 前加 "user_" 前缀。
 */
export async function genTestUserSig(memberId: string): Promise<UserSigResult> {
  if (!TRTC_SDK_APP_ID || !TRTC_SECRET_KEY) {
    throw new Error(
      '[genTestUserSig] config.yaml 中未配置 trtc.sdkAppId 或 trtc.secretKey'
    );
  }

  // TRTC 禁止纯数字 userId，memberId 为雪花 ID（全数字），统一加 user_ 前缀
  const userId = /^\d+$/.test(memberId) ? `user_${memberId}` : memberId;
  const currTime = Math.floor(Date.now() / 1000);

  // Step 1：构造 HMAC-SHA256 签名原文（字段顺序固定）
  const sigPlaintext = [
    `TLS.identifier:${userId}`,
    `TLS.sdkappid:${TRTC_SDK_APP_ID}`,
    `TLS.time:${currTime}`,
    `TLS.expire:${EXPIRE_SECONDS}`,
  ].join('\n') + '\n';

  // Step 2：HMAC-SHA256 签名（Web Crypto API）
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(TRTC_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(sigPlaintext));
  const sigBase64 = uint8ToBase64(new Uint8Array(sigBuffer));

  // Step 3：构造 JSON payload（字段名和格式由腾讯云 TLS 规范定义）
  const payload = JSON.stringify({
    'TLS.ver':        '2.0',
    'TLS.identifier': String(userId),
    'TLS.sdkappid':   TRTC_SDK_APP_ID,
    'TLS.expire':     EXPIRE_SECONDS,
    'TLS.time':       currTime,
    'TLS.sig':        sigBase64,
  });

  // Step 4：zlib deflate 压缩（CompressionStream，浏览器内置）
  const compressed = await zlibDeflate(payload);

  // Step 5：按腾讯官方规则做 escape 编码（+ -> *、/ -> -、= -> _）
  // 这里不能用通用 base64url（+ -> -、/ -> _、去掉 =），否则会导致 UserSig 校验失败（70003）
  const userSig = uint8ToTencentUserSig(compressed);

  return { sdkAppId: TRTC_SDK_APP_ID, userId, userSig };
}

// ----------------------------------------------------------------
// 内部工具函数
// ----------------------------------------------------------------

/** Uint8Array → 标准 Base64 */
function uint8ToBase64(data: Uint8Array): string {
  let binary = '';
  data.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

/** Uint8Array → 腾讯 UserSig 专用编码（与官方 JS 生成器一致） */
function uint8ToTencentUserSig(data: Uint8Array): string {
  return uint8ToBase64(data)
    .replace(/\+/g, '*')
    .replace(/\//g, '-')
    .replace(/=/g, '_');
}

/** zlib deflate 压缩（与 Node.js zlib.deflateSync 等价） */
async function zlibDeflate(text: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const stream = new CompressionStream('deflate');
  const writer = stream.writable.getWriter();
  writer.write(encoder.encode(text));
  writer.close();

  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
