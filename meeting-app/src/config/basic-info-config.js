/*
 * @Description: Basic information configuration for TUIRoomKit applications
 */

import LibGenerateTestUserSig from './lib-generate-test-usersig-es.min';

/**
 * SDKAppId 和 SecretKey 由 vite.config.ts 在构建时从根目录 config.yaml 读取并注入，
 * 不在源码中硬编码，方便统一管理和修改。
 */

// 由 vite.config.ts define 注入，值来自 config.yaml -> trtc.sdkAppId
export const SDKAPPID = __TRTC_SDK_APP_ID__;

// 由 vite.config.ts define 注入，值来自 config.yaml -> trtc.secretKey
export const SDKSECRETKEY = __TRTC_SECRET_KEY__;

/**
 * Signature expiration time, which should not be too short
 * Time unit: second
 * Default time: 7 * 24 * 60 * 60 = 604800 = 7days
 *
 */
export const EXPIRETIME = 604800;

const generator = new LibGenerateTestUserSig(SDKAPPID, SDKSECRETKEY, EXPIRETIME);

export function genTestUserSig(userId) {
  return generator.genTestUserSig(userId);
}
