/**
 * 全局状态管理
 * 使用 Zustand 进行状态管理，轻量且易于使用
 */
import { create } from 'zustand';
import { FileItem, FolderInfo, UserInfo, ModalType, FolderMember, PermissionType } from '../types';

/**
 * 应用全局状态接口
 */
interface AppState {
  // ==================== 用户相关状态 ====================
  currentUser: UserInfo | null;           // 当前登录用户
  setCurrentUser: (user: UserInfo | null) => void;

  // ==================== 文件相关状态 ====================
  files: FileItem[];                      // 文件列表
  setFiles: (files: FileItem[]) => void;

  currentFolder: FolderInfo | null;       // 当前打开的文件夹
  setCurrentFolder: (folder: FolderInfo | null) => void;

  selectedFiles: string[];                // 选中的文件ID列表
  setSelectedFiles: (ids: string[]) => void;
  toggleFileSelection: (id: string) => void;
  clearSelection: () => void;

  // ==================== 弹窗相关状态 ====================
  activeModal: ModalType;                 // 当前激活的弹窗
  setActiveModal: (modal: ModalType) => void;

  addMemberModalOpen: boolean;            // 添加成员弹窗是否打开
  setAddMemberModalOpen: (open: boolean) => void;

  // ==================== 侧边栏相关状态 ====================
  sidebarCollapsed: boolean;              // 侧边栏是否折叠
  setSidebarCollapsed: (collapsed: boolean) => void;

  treeVisible: boolean;                   // 目录树是否可见
  setTreeVisible: (visible: boolean) => void;

  // ==================== 成员管理相关状态 ====================
  folderMembers: FolderMember[];          // 文件夹成员列表
  setFolderMembers: (members: FolderMember[]) => void;
  addFolderMember: (member: FolderMember) => void;

  folderPermission: PermissionType;       // 文件夹权限
  setFolderPermission: (permission: PermissionType) => void;
}

/**
 * 创建全局状态存储
 */
export const useAppStore = create<AppState>((set) => ({
  // ==================== 用户相关 ====================
  currentUser: {
    id: 'user_001',
    name: 'Echo',
    avatar: undefined,
    email: 'echo@example.com',
  },
  setCurrentUser: (user) => set({ currentUser: user }),

  // ==================== 文件相关 ====================
  files: [],
  setFiles: (files) => set({ files }),

  currentFolder: null,
  setCurrentFolder: (folder) => set({ currentFolder: folder }),

  selectedFiles: [],
  setSelectedFiles: (ids) => set({ selectedFiles: ids }),
  toggleFileSelection: (id) => set((state) => ({
    selectedFiles: state.selectedFiles.includes(id)
      ? state.selectedFiles.filter((fileId) => fileId !== id)
      : [...state.selectedFiles, id],
  })),
  clearSelection: () => set({ selectedFiles: [] }),

  // ==================== 弹窗相关 ====================
  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal }),

  addMemberModalOpen: false,
  setAddMemberModalOpen: (open) => set({ addMemberModalOpen: open }),

  // ==================== 侧边栏相关 ====================
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  treeVisible: false,
  setTreeVisible: (visible) => set({ treeVisible: visible }),

  // ==================== 成员管理相关 ====================
  folderMembers: [
    {
      id: 'member_001',
      userId: 'user_001',
      userName: 'Echo',
      role: 'owner',
    },
  ],
  setFolderMembers: (members) => set({ folderMembers: members }),
  addFolderMember: (member) => set((state) => ({
    folderMembers: [...state.folderMembers, member],
  })),

  folderPermission: 'private',
  setFolderPermission: (permission) => set({ folderPermission: permission }),
}));
