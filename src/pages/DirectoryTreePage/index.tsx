/**
 * 目录树展开页面
 * 对应设计稿中的"页面3_目录树展开页面"
 * 展开目录树弹窗显示文件结构
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tree, Button, Space, Dropdown, Modal, Input } from 'antd';
import type { MenuProps, TreeDataNode } from 'antd';
import {
  FolderOutlined,
  FileTextOutlined,
  PlusOutlined,
  PushpinOutlined,
  MoreOutlined,
  TeamOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import LeftPanel from '../../components/LeftPanel';
import RightContent from '../../components/RightContent';
import { FileItem, FileType } from '../../types';
import { useAppStore } from '../../store';
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
  const { setActiveModal, materialItems, renameMaterialItem } = useAppStore();

  // 悬停的素材项 ID
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  // 重命名弹窗状态
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  /**
   * 打开添加资料弹窗
   */
  const handleAddMaterial = () => {
    setActiveModal('addFile');
  };

  /**
   * 打开重命名弹窗
   */
  const handleOpenRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
    setRenameModalOpen(true);
  };

  /**
   * 确认重命名
   */
  const handleRenameConfirm = () => {
    if (renamingId && renameValue.trim()) {
      renameMaterialItem(renamingId, renameValue.trim());
    }
    setRenameModalOpen(false);
    setRenamingId(null);
  };

  /**
   * 素材三点菜单
   */
  const getMaterialMenuItems = (id: string, name: string): MenuProps['items'] => [
    {
      key: 'rename',
      label: '重命名',
      onClick: () => handleOpenRename(id, name),
    },
  ];

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
            onClick={handleAddMaterial}
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

          {/* 素材列表（研讨会 / 直播） */}
          {materialItems.length > 0 && (
            <div className={styles.materialList}>
              {materialItems.map((item) => (
                <div
                  key={item.id}
                  className={styles.materialItem}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  {item.sourceType === 'seminar'
                    ? <TeamOutlined className={styles.materialIcon} style={{ color: '#4A90D9' }} />
                    : <PlayCircleOutlined className={styles.materialIcon} style={{ color: '#F56C6C' }} />
                  }
                  <span className={styles.materialName}>{item.name}</span>
                  {hoveredItemId === item.id && (
                    <Dropdown
                      menu={{ items: getMaterialMenuItems(item.id, item.name) }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <div
                        className={styles.materialMore}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreOutlined />
                      </div>
                    </Dropdown>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== 重命名弹窗 ==================== */}
      <Modal
        title="重命名"
        open={renameModalOpen}
        onOk={handleRenameConfirm}
        onCancel={() => setRenameModalOpen(false)}
        okText="确定"
        cancelText="取消"
        width={360}
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={handleRenameConfirm}
          autoFocus
        />
      </Modal>

      {/* ==================== 右侧内容区 ==================== */}
      <RightContent />
    </div>
  );
};

export default DirectoryTreePage;
