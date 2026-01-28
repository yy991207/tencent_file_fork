/**
 * 左侧面板组件
 * 显示文件夹信息、添加资料按钮和文件列表
 */
import React from 'react';
import { Button, Space } from 'antd';
import {
  PlusOutlined,
  TeamOutlined,
  ExportOutlined,
  CloseOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import FolderIcon from '../FolderIcon';
import FileList from '../FileList';
import { useAppStore } from '../../store';
import { FileItem } from '../../types';
import styles from './index.module.less';

interface LeftPanelProps {
  showTopBar?: boolean;          // 是否显示顶部栏
  folderName?: string;           // 文件夹名称
  fileCount?: number;            // 文件数量
  folderCount?: number;          // 文件夹数量
  files?: FileItem[];            // 文件列表
  onFileClick?: (file: FileItem) => void;
  onFolderClick?: (folder: FileItem) => void;
  onClose?: () => void;          // 关闭面板回调
  onToggleTree?: () => void;     // 切换目录树显示回调
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  showTopBar = true,
  folderName = 'clawd',
  fileCount = 3,
  folderCount = 1,
  files = [],
  onFileClick,
  onFolderClick,
  onClose,
  onToggleTree,
}) => {
  const { setActiveModal } = useAppStore();

  /**
   * 打开添加资料弹窗
   */
  const handleAddFile = () => {
    setActiveModal('addFile');
  };

  /**
   * 打开成员管理抽屉
   */
  const handleOpenMemberManage = () => {
    setActiveModal('memberManage');
  };

  return (
    <div className={styles.leftPanel}>
      {/* ==================== 顶部栏（仅在目录展开时显示） ==================== */}
      {showTopBar && (
        <div className={styles.topBar}>
          <span className={styles.topBarTitle}>{folderName}</span>
          <Space size={8}>
            <TeamOutlined
              className={styles.topBarIcon}
              onClick={handleOpenMemberManage}
            />
            <ExportOutlined className={styles.topBarIcon} />
            <CloseOutlined className={styles.topBarIcon} onClick={onClose} />
          </Space>
        </div>
      )}

      {/* ==================== 主内容区 ==================== */}
      <div className={styles.mainContent}>
        {/* 侧边切换按钮 - 点击显示/隐藏目录树 */}
        <div className={styles.sideToggle} onClick={onToggleTree}>
          <UnorderedListOutlined className={styles.toggleIcon} />
        </div>

        {/* 内容区域 */}
        <div className={styles.contentArea}>
          {/* 文件夹信息头部 */}
          <div className={styles.folderHeader}>
            <FolderIcon size="large" />
            <div className={styles.folderInfo}>
              <h2 className={styles.folderTitle}>{folderName}</h2>
              <p className={styles.folderMeta}>
                {fileCount}个文件 | {folderCount}个文件夹
              </p>
            </div>
          </div>

          {/* 添加资料按钮 */}
          <Button
            className={styles.addButton}
            icon={<PlusOutlined />}
            onClick={handleAddFile}
            block
          >
            添加资料
          </Button>

          {/* 文件列表表头 */}
          <div className={styles.listHeader}>
            <span>名称</span>
            <div className={styles.listHeaderRight}>
              <span>所有者</span>
              <span>最近编辑 ▼</span>
            </div>
          </div>

          {/* 文件列表 */}
          <FileList
            files={files}
            onFileClick={onFileClick}
            onFolderClick={onFolderClick}
          />
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
