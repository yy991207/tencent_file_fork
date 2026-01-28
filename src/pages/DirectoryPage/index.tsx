/**
 * 目录展开页面
 * 对应设计稿中的"页面2_目录展开页面"
 * 点击文件夹后展开目录列表
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import LeftPanel from '../../components/LeftPanel';
import RightContent from '../../components/RightContent';
import MemberManageDrawer from '../../components/MemberManageDrawer';
import { useAppStore } from '../../store';
import { FileItem, FileType } from '../../types';
import styles from './index.module.less';

/**
 * 模拟文件数据
 */
const mockFiles: FileItem[] = [
  {
    id: '1',
    name: '.git',
    type: FileType.FOLDER,
    owner: '我',
    ownerId: 'user_001',
    lastModified: '14:21',
  },
  {
    id: '2',
    name: 'HEARTBEAT',
    type: FileType.DOCUMENT,
    owner: '我',
    ownerId: 'user_001',
    lastModified: '14:21',
  },
  {
    id: '3',
    name: 'USER',
    type: FileType.DOCUMENT,
    owner: '我',
    ownerId: 'user_001',
    lastModified: '14:21',
  },
  {
    id: '4',
    name: 'TOOLS',
    type: FileType.DOCUMENT,
    owner: '我',
    ownerId: 'user_001',
    lastModified: '14:21',
  },
];

const DirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeModal } = useAppStore();

  /**
   * 处理关闭面板
   */
  const handleClose = () => {
    navigate('/');
  };

  /**
   * 处理文件夹点击
   * 进入子文件夹（暂时不做处理）
   */
  const handleFolderClick = (_folder: FileItem) => {
    // TODO: 进入子文件夹，显示子文件夹内容
    console.log('进入子文件夹');
  };

  /**
   * 处理文档点击
   */
  const handleFileClick = (file: FileItem) => {
    navigate(`/document/${file.id}`);
  };

  /**
   * 处理目录树切换按钮点击
   * 触发条件: toggleIcon_列表图标按钮（红色标记）
   * 目标页面: directory-tree (目录树展开页面)
   */
  const handleToggleTree = () => {
    navigate('/directory-tree');
  };

  return (
    <div className={styles.directoryPage}>
      {/* ==================== 左侧面板（带成员管理抽屉的容器） ==================== */}
      <div className={styles.leftPanelContainer}>
        <LeftPanel
          showTopBar={true}
          folderName="clawd"
          fileCount={3}
          folderCount={1}
          files={mockFiles}
          onFileClick={handleFileClick}
          onFolderClick={handleFolderClick}
          onClose={handleClose}
          onToggleTree={handleToggleTree}
        />

        {/*
          成员管理抽屉 - 右滑进场
          触发条件: shareIcon_与他人协作图标
          此处的抽屉相对于左侧面板容器定位
        */}
        {activeModal === 'memberManage' && (
          <div className={styles.drawerContainer}>
            <MemberManageDrawer />
          </div>
        )}
      </div>

      {/* ==================== 右侧内容区 ==================== */}
      <RightContent />
    </div>
  );
};

export default DirectoryPage;
