/**
 * 目录树展开页面
 * 对应设计稿中的"页面3_目录树展开页面"
 * 展开目录树弹窗显示文件结构
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tree, Button, Space } from 'antd';
import type { TreeDataNode } from 'antd';
import {
  FolderOutlined,
  FileTextOutlined,
  PlusOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import LeftPanel from '../../components/LeftPanel';
import RightContent from '../../components/RightContent';
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

/**
 * 目录树数据
 */
const treeData: TreeDataNode[] = [
  {
    title: 'clawd',
    key: 'clawd',
    icon: <FolderOutlined style={{ color: '#4A90D9' }} />,
    children: [
      {
        title: '.git',
        key: '.git',
        icon: <FolderOutlined style={{ color: '#4A90D9' }} />,
        children: [
          { title: 'hooks', key: 'hooks', icon: <FolderOutlined /> },
        ],
      },
      { title: 'HEARTBEAT', key: 'HEARTBEAT', icon: <FileTextOutlined style={{ color: '#4285F4' }} />, isLeaf: true },
      { title: 'USER', key: 'USER', icon: <FileTextOutlined style={{ color: '#4285F4' }} />, isLeaf: true },
      { title: 'TOOLS', key: 'TOOLS', icon: <FileTextOutlined style={{ color: '#4285F4' }} />, isLeaf: true },
    ],
  },
];

const DirectoryTreePage: React.FC = () => {
  const navigate = useNavigate();

  /**
   * 处理关闭面板
   */
  const handleClose = () => {
    navigate('/');
  };

  /**
   * 处理文档点击
   */
  const handleFileClick = (file: FileItem) => {
    navigate(`/document/${file.id}`);
  };

  /**
   * 处理树节点选择
   */
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    console.log('选中节点:', selectedKeys);
  };

  /**
   * 处理目录树切换按钮点击
   * 返回首页（展开状态）
   */
  const handleToggleTree = () => {
    navigate('/', { state: { expanded: true } });
  };

  return (
    <div className={styles.directoryTreePage}>
      {/* ==================== 左侧面板（包含目录树弹窗） ==================== */}
      <div className={styles.leftPanelContainer}>
        {/* 子文档列表面板 */}
        <LeftPanel
          showTopBar={true}
          folderName="clawd"
          fileCount={3}
          folderCount={1}
          files={mockFiles}
          onFileClick={handleFileClick}
          onClose={handleClose}
          onToggleTree={handleToggleTree}
        />

        {/* 目录树弹窗 */}
        <div className={styles.treePopup}>
          {/* 弹窗头部 */}
          <div className={styles.treeHeader}>
            <span className={styles.treeTitle}>资料</span>
            <PushpinOutlined className={styles.pinIcon} />
          </div>

          {/* 添加资料按钮 */}
          <Button
            className={styles.treeAddBtn}
            icon={<PlusOutlined />}
            block
          >
            添加资料
          </Button>

          {/* 已选择提示 */}
          <div className={styles.selectedInfo}>
            <span>已选 1 项目</span>
            <Space size={12}>
              <FileTextOutlined />
              <FileTextOutlined />
              <FolderOutlined />
            </Space>
          </div>

          {/* 目录树 */}
          <div className={styles.treeContent}>
            <Tree
              showIcon
              defaultExpandAll
              treeData={treeData}
              onSelect={handleTreeSelect}
              className={styles.tree}
            />
          </div>
        </div>
      </div>

      {/* ==================== 右侧内容区 ==================== */}
      <RightContent />
    </div>
  );
};

export default DirectoryTreePage;
