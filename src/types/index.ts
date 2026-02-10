/**
 * 全局类型定义文件
 * 定义应用中使用的所有数据类型接口
 */

/**
 * 文件类型枚举
 * 用于区分不同类型的文件
 */
export enum FileType {
  FOLDER = 'folder',      // 文件夹
  DOCUMENT = 'document',  // 文档
  MARKDOWN = 'markdown',  // Markdown文件
  IMAGE = 'image',        // 图片
  VIDEO = 'video',        // 视频
  AUDIO = 'audio',        // 音频
  ARCHIVE = 'archive',    // 压缩包
  MEETING = 'meeting',    // 会议记录
  OTHER = 'other',        // 其他类型
}

/**
 * 文件/文件夹数据结构
 */
export interface FileItem {
  id: string;                    // 唯一标识
  name: string;                  // 文件名
  type: FileType;                // 文件类型
  owner: string;                 // 所有者
  ownerId: string;               // 所有者ID
  lastModified: string;          // 最后修改时间
  size?: number;                 // 文件大小（字节）
  children?: FileItem[];         // 子文件/文件夹（仅文件夹有）
  parentId?: string;             // 父文件夹ID
  path?: string;                 // 文件路径
}

/**
 * 文件夹信息
 */
export interface FolderInfo {
  id: string;
  name: string;
  fileCount: number;             // 文件数量
  folderCount: number;           // 文件夹数量
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;               // 头像URL
  email?: string;
}

/**
 * 文件夹成员
 */
export interface FolderMember {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';  // 角色：所有者/编辑者/查看者
  joinTime?: string;
}

/**
 * 权限设置类型
 */
export type PermissionType = 'private' | 'specified' | 'viewable' | 'editable';

/**
 * 权限配置
 */
export interface PermissionConfig {
  type: PermissionType;
  label: string;
}

/**
 * 弹窗类型
 */
export type ModalType = 'addFile' | 'share' | 'memberManage' | null;

/**
 * 目录树节点
 */
export interface TreeNode {
  key: string;
  title: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  isLeaf?: boolean;
}

/**
 * 页面元数据 - 用于描述页面之间的关联关系
 */
export interface PageMetadata {
  pageId: string;                // 页面唯一标识
  description: string;           // 页面描述
  fromPage?: string;             // 来源页面
  trigger?: string;              // 触发元素
  modalType?: 'center' | 'slideRight';  // 弹窗类型
  animation?: string;            // 动画效果
  interactions?: Array<{
    trigger: string;             // 触发元素
    targetPage: string;          // 目标页面
  }>;
}
