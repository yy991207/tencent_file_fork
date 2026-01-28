/**
 * 首页组件
 * 对应设计稿中的"页面1_腾讯文档首页"、"页面2_目录展开页面"、"页面3_目录树展开页面"
 * 支持面板展开/收起、目录树显示/隐藏、成员管理抽屉等功能
 */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Tree, Space } from 'antd';
import type { TreeDataNode } from 'antd';
import {
  PlusOutlined,
  PushpinOutlined,
  SearchOutlined,
  EllipsisOutlined,
  CheckCircleOutlined,
  FolderOutlined,
  FileTextOutlined,
  TeamOutlined,
  ExportOutlined,
  CloseOutlined,
  UnorderedListOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import FolderIcon from '../../components/FolderIcon';
import FileList from '../../components/FileList';
import RightContent from '../../components/RightContent';
import MemberManageDrawer from '../../components/MemberManageDrawer';
import { useAppStore } from '../../store';
import { FileItem, FileType } from '../../types';
import styles from './index.module.less';

/**
 * 文件夹树数据（收起状态显示）
 */
const collapsedTreeData: TreeDataNode[] = [
  {
    title: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span>clawd</span>
        <CheckCircleOutlined style={{ color: '#ccc', marginLeft: 'auto' }} />
      </div>
    ),
    key: 'clawd',
    icon: <FolderOutlined style={{ color: '#4A90D9' }} />,
  },
];

/**
 * 目录树数据（目录树弹窗显示）
 */
const directoryTreeData: TreeDataNode[] = [
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

/**
 * 模拟文件数据结构（支持嵌套目录）
 */
interface FolderData {
  name: string;
  files: FileItem[];
  fileCount: number;
  folderCount: number;
}

const mockFolderData: Record<string, FolderData> = {
  'clawd': {
    name: 'clawd',
    files: [
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
    ],
    fileCount: 3,
    folderCount: 1,
  },
  '.git': {
    name: '.git',
    files: [
      {
        id: '5',
        name: 'hooks',
        type: FileType.FOLDER,
        owner: '我',
        ownerId: 'user_001',
        lastModified: '14:21',
      },
      {
        id: '6',
        name: 'config',
        type: FileType.DOCUMENT,
        owner: '我',
        ownerId: 'user_001',
        lastModified: '14:21',
      },
      {
        id: '7',
        name: 'HEAD',
        type: FileType.DOCUMENT,
        owner: '我',
        ownerId: 'user_001',
        lastModified: '14:21',
      },
    ],
    fileCount: 2,
    folderCount: 1,
  },
  'hooks': {
    name: 'hooks',
    files: [
      {
        id: '8',
        name: 'pre-commit',
        type: FileType.DOCUMENT,
        owner: '我',
        ownerId: 'user_001',
        lastModified: '14:21',
      },
      {
        id: '9',
        name: 'post-commit',
        type: FileType.DOCUMENT,
        owner: '我',
        ownerId: 'user_001',
        lastModified: '14:21',
      },
    ],
    fileCount: 2,
    folderCount: 0,
  },
};

const HomePage: React.FC = () => {
  const location = useLocation();
  const { setActiveModal } = useAppStore();

  // 控制面板是否展开的状态
  const [expanded, setExpanded] = useState(false);
  // 控制目录树弹窗是否显示
  const [treeVisible, setTreeVisible] = useState(false);
  // 当前文件夹路径栈（用于导航）
  const [folderPath, setFolderPath] = useState<string[]>(['clawd']);
  // 当前选中的文档（用于显示文档详情）
  const [selectedDocument, setSelectedDocument] = useState<FileItem | null>(null);
  // 置顶模式（固定左侧边栏）
  const [pinnedMode, setPinnedMode] = useState(false);

  // 获取当前文件夹数据
  const currentFolderName = folderPath[folderPath.length - 1];
  const currentFolder = mockFolderData[currentFolderName] || mockFolderData['clawd'];

  // 目录树弹窗的 ref，用于检测点击外部
  const treePopupRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLDivElement>(null);

  /**
   * 从路由状态恢复展开状态
   */
  useEffect(() => {
    const state = location.state as { expanded?: boolean; treeVisible?: boolean } | null;
    if (state?.expanded) {
      setExpanded(true);
    }
    if (state?.treeVisible) {
      setTreeVisible(true);
    }
    // 清除路由状态
    if (state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  /**
   * 点击外部关闭目录树
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果目录树不可见，不处理
      if (!treeVisible) return;

      const target = event.target as Node;

      // 检查是否点击了目录树弹窗内部
      if (treePopupRef.current && treePopupRef.current.contains(target)) {
        return;
      }

      // 检查是否点击了切换按钮
      if (toggleButtonRef.current && toggleButtonRef.current.contains(target)) {
        return;
      }

      // 点击了外部，关闭目录树
      setTreeVisible(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [treeVisible]);

  /**
   * 处理添加资料按钮点击
   */
  const handleAddFile = () => {
    setActiveModal('addFile');
  };

  /**
   * 处理文件夹点击（收起状态）
   * 展开面板显示文件列表
   */
  const handleFolderSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      setExpanded(true);
    }
  };

  /**
   * 处理关闭面板
   * 收起面板回到初始状态
   */
  const handleClose = () => {
    setExpanded(false);
    setTreeVisible(false);
  };

  /**
   * 处理成员管理按钮点击
   */
  const handleOpenMemberManage = () => {
    setActiveModal('memberManage');
  };

  /**
   * 处理文件点击
   * 如果是文件夹，进入子目录；如果是文档，展示文档详情
   */
  const handleFileClick = (file: FileItem) => {
    if (file.type === FileType.FOLDER) {
      // 进入子文件夹
      if (mockFolderData[file.name]) {
        setFolderPath([...folderPath, file.name]);
      }
    } else {
      // 展示文档详情（动画过渡）
      setSelectedDocument(file);
    }
  };

  /**
   * 处理返回文件列表
   */
  const handleBackToList = () => {
    setSelectedDocument(null);
  };

  /**
   * 处理目录树显示（鼠标悬停触发）
   */
  const handleShowTree = () => {
    setTreeVisible(true);
  };

  /**
   * 处理侧边按钮点击（返回收起状态）
   */
  const handleSideToggleClick = () => {
    setExpanded(false);
    setTreeVisible(false);
    setFolderPath(['clawd']); // 重置到根目录
    setSelectedDocument(null); // 清除选中的文档
  };

  /**
   * 处理目录树节点选择
   * 选择文件夹后导航到该文件夹
   */
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const selectedKey = selectedKeys[0] as string;
      // 根据选择的节点更新文件夹路径
      if (selectedKey === 'clawd') {
        setFolderPath(['clawd']);
      } else if (selectedKey === '.git') {
        setFolderPath(['clawd', '.git']);
      } else if (selectedKey === 'hooks') {
        setFolderPath(['clawd', '.git', 'hooks']);
      }
      // 选择后关闭目录树
      setTreeVisible(false);
    }
  };

  /**
   * 处理置顶按钮点击
   * 切换置顶状态，固定左侧边栏
   */
  const handlePinClick = () => {
    setPinnedMode(!pinnedMode);
  };

  return (
    <div className={styles.homePage}>
      {/* ==================== 左侧面板容器 ==================== */}
      <div className={styles.leftPanelContainer}>
        {/* 面板主体 - 根据 expanded 状态改变宽度 */}
        <div className={`${styles.leftPanel} ${expanded ? styles.expanded : ''}`}>

          {/* ==================== 顶部栏（展开时显示） ==================== */}
          <div className={`${styles.topBar} ${expanded ? styles.visible : ''}`}>
            <span className={styles.topBarTitle}>{currentFolder.name}</span>
            <div className={styles.topBarIcons}>
              <TeamOutlined
                className={styles.topBarIcon}
                onClick={handleOpenMemberManage}
              />
              <ExportOutlined className={styles.topBarIcon} />
              <CloseOutlined className={styles.topBarIcon} onClick={handleClose} />
            </div>
          </div>

          {/* ==================== 面板头部（收起时显示"资料"，展开时隐藏） ==================== */}
          <div className={`${styles.panelHeader} ${expanded ? styles.hidden : ''}`}>
            <span className={styles.panelTitle}>资料</span>
            <PushpinOutlined
              className={`${styles.pinIcon} ${pinnedMode ? styles.pinIconActive : ''}`}
              onClick={handlePinClick}
            />
          </div>

          {/* ==================== 主内容区 ==================== */}
          <div className={styles.mainContent}>
            {/* 侧边切换按钮（展开时显示） */}
            <div
              ref={toggleButtonRef}
              className={`${styles.sideToggle} ${expanded ? styles.visible : ''}`}
              onMouseEnter={handleShowTree}
              onClick={handleSideToggleClick}
            >
              <UnorderedListOutlined className={styles.toggleIcon} />
            </div>

            {/* 内容区域 */}
            <div className={styles.contentArea}>
              {/* 添加资料按钮 */}
              <div className={styles.addBtnWrapper}>
                <Button
                  className={styles.addButton}
                  icon={<PlusOutlined />}
                  onClick={handleAddFile}
                  block
                >
                  添加资料
                </Button>
              </div>

              {/* ==================== 收起状态内容 ==================== */}
              <div className={`${styles.collapsedContent} ${expanded ? styles.hidden : ''}`}>
                {/* 工具栏 */}
                <div className={styles.toolbar}>
                  <span className={styles.selectedInfo}>已选 1 项目</span>
                  <div className={styles.toolIcons}>
                    <SearchOutlined className={styles.toolIcon} />
                    <EllipsisOutlined className={styles.toolIcon} />
                    <CheckCircleOutlined className={styles.toolIcon} />
                  </div>
                </div>

                {/* 文件夹列表 */}
                <div className={styles.folderList}>
                  <Tree
                    showIcon
                    defaultExpandAll
                    treeData={collapsedTreeData}
                    onSelect={handleFolderSelect}
                    className={styles.tree}
                  />
                </div>
              </div>

              {/* ==================== 展开状态内容 ==================== */}
              <div className={`${styles.expandedContent} ${expanded ? styles.visible : ''}`}>
                {/* 文件列表视图 */}
                <div className={`${styles.fileListView} ${selectedDocument ? styles.hidden : ''}`}>
                  {/* 文件夹信息头部 */}
                  <div className={styles.folderHeader}>
                    <FolderIcon size="large" />
                    <div className={styles.folderInfo}>
                      <h2 className={styles.folderTitle}>{currentFolder.name}</h2>
                      <p className={styles.folderMeta}>{currentFolder.fileCount}个文件 | {currentFolder.folderCount}个文件夹</p>
                    </div>
                  </div>

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
                    files={currentFolder.files}
                    onFileClick={handleFileClick}
                  />
                </div>

                {/* 文档详情视图 */}
                <div className={`${styles.documentView} ${selectedDocument ? styles.visible : ''}`}>
                  {selectedDocument && (
                    <>
                      {/* 文档头部 */}
                      <div className={styles.documentHeader}>
                        <ArrowLeftOutlined
                          className={styles.backIcon}
                          onClick={handleBackToList}
                        />
                        <FileTextOutlined className={styles.documentIcon} />
                        <h2 className={styles.documentTitle}>{selectedDocument.name}</h2>
                      </div>

                      {/* 文档信息 */}
                      <div className={styles.documentMeta}>
                        <span>所有者: {selectedDocument.owner}</span>
                        <span>最近编辑: {selectedDocument.lastModified}</span>
                      </div>

                      {/* 文档内容区域 */}
                      <div className={styles.documentContent}>
                        <p className={styles.documentPlaceholder}>
                          这里是 {selectedDocument.name} 文档的内容区域...
                        </p>
                        <p className={styles.documentPlaceholder}>
                          文档内容将在此处显示。
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==================== 成员管理抽屉容器（定位在左侧面板右边界） ==================== */}
          <div className={styles.drawerWrapper}>
            <MemberManageDrawer />
          </div>
        </div>

        {/* ==================== 目录树弹窗（点击切换按钮显示） ==================== */}
        <div
          ref={treePopupRef}
          className={`${styles.treePopup} ${treeVisible && expanded ? styles.visible : ''}`}
        >
          {/* 弹窗头部 */}
          <div className={styles.treeHeader}>
            <span className={styles.treeTitle}>资料</span>
            <PushpinOutlined className={styles.treePinIcon} />
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
          <div className={styles.treeSelectedInfo}>
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
              treeData={directoryTreeData}
              onSelect={handleTreeSelect}
              className={styles.directoryTree}
            />
          </div>
        </div>
      </div>

      {/* ==================== 右侧内容区 ==================== */}
      <RightContent />
    </div>
  );
};

export default HomePage;
