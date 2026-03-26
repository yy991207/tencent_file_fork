#!/bin/bash
# 在 macOS 开发模式下注册 tencent-meeting:// 协议
# Electron 的 setAsDefaultProtocolClient 在开发模式下经常不生效，
# 需要通过 LaunchServices 手动注册

PLIST_PATH="$HOME/Library/Preferences/tencent-meeting-dev.plist"
ELECTRON_PATH=$(which electron 2>/dev/null || echo "$(npm root -g)/electron/dist/Electron.app")

# 找到本地 electron 可执行文件的 .app 路径
LOCAL_ELECTRON="$(cd "$(dirname "$0")" && pwd)/node_modules/electron/dist/Electron.app"

if [ -d "$LOCAL_ELECTRON" ]; then
  APP_PATH="$LOCAL_ELECTRON"
else
  echo "找不到本地 Electron.app，请确认已执行 npm install"
  exit 1
fi

echo "Electron.app 路径: $APP_PATH"
echo "正在注册 tencent-meeting:// 协议..."

# 修改 Electron.app 的 Info.plist，添加 URL scheme
INFOPLIST="$APP_PATH/Contents/Info.plist"

# 检查是否已注册
if /usr/libexec/PlistBuddy -c "Print :CFBundleURLTypes:0:CFBundleURLSchemes:0" "$INFOPLIST" 2>/dev/null | grep -q "tencent-meeting"; then
  echo "协议已注册，无需重复操作"
else
  # 添加 URL scheme
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$INFOPLIST" 2>/dev/null
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$INFOPLIST"
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string com.tencent.meeting.whiteboard" "$INFOPLIST"
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$INFOPLIST"
  /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string tencent-meeting" "$INFOPLIST"
  echo "已写入 Info.plist"
fi

# 刷新 LaunchServices 让系统识别新的协议处理器
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP_PATH"
echo "已刷新 LaunchServices 注册"
echo ""
echo "注册完成! 现在可以测试:"
echo "  open \"tencent-meeting://join?roomId=123456&userId=user_001&userSig=test&sdkAppId=1600133055\""
