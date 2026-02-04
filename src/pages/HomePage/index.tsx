/**
 * 首页组件
 * 对应设计稿中的"页面1_腾讯文档首页"、"页面2_目录展开页面"、"页面3_目录树展开页面"
 * 支持面板展开/收起、目录树显示/隐藏、成员管理抽屉等功能
 * 支持文件拖拽排序和移入文件夹功能
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
 * 文件夹数据结构（支持嵌套目录）
 */
interface FolderData {
  name: string;
  files: FileItem[];
  fileCount: number;
  folderCount: number;
}

/**
 * 初始文件数据
 */
const initialFolderData: Record<string, FolderData> = {
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

/**
 * 拖拽放置位置类型
 */
type DropPosition = 'inside' | 'before' | 'after' | null;

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
  // 置顶模式（固定左侧边栏，点击内容在右侧展开）
  const [pinnedMode, setPinnedMode] = useState(false);
  // 置顶模式下选中的内容（文档或文件夹）
  const [pinnedSelectedItem, setPinnedSelectedItem] = useState<FileItem | null>(null);

  // 文件夹数据状态（支持动态更新）
  const [folderData, setFolderData] = useState<Record<string, FolderData>>(initialFolderData);

  // 获取当前文件夹数据
  const currentFolderName = folderPath[folderPath.length - 1];
  const currentFolder = folderData[currentFolderName] || folderData['clawd'];

  // 构建子文件映射（用于文件夹展开功能）
  // 将 folderData 转换为 childrenMap 格式（文件夹名 -> 子文件列表）
  const childrenMap = useMemo(() => {
    const map: Record<string, FileItem[]> = {};
    Object.keys(folderData).forEach(folderName => {
      map[folderName] = folderData[folderName].files;
    });
    return map;
  }, [folderData]);

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
   * 计算文件夹的文件数和文件夹数
   */
  const calculateCounts = useCallback((files: FileItem[]): { fileCount: number; folderCount: number } => {
    let fileCount = 0;
    let folderCount = 0;
    files.forEach(file => {
      if (file.type === FileType.FOLDER) {
        folderCount++;
      } else {
        fileCount++;
      }
    });
    return { fileCount, folderCount };
  }, []);

  /**
   * 在所有文件夹中查找指定文件所在的文件夹名称
   * @param data 文件夹数据
   * @param itemId 要查找的文件 ID
   * @returns 文件所在的文件夹名称，找不到返回 null
   */
  const findItemFolder = useCallback((
    data: Record<string, FolderData>,
    itemId: string
  ): string | null => {
    for (const folderName of Object.keys(data)) {
      const folder = data[folderName];
      const found = folder.files.find(f => f.id === itemId);
      if (found) {
        return folderName;
      }
    }
    return null;
  }, []);

  /**
   * 处理文件拖拽放置
   * 实现真正的文件移动功能
   * @param dragItem 被拖拽的文件/文件夹
   * @param targetItem 目标位置的文件/文件夹
   * @param position 放置位置：'inside'放入文件夹, 'before'插入到目标前面, 'after'插入到目标后面
   */
  const handleFileDrop = useCallback((
    dragItem: FileItem,
    targetItem: FileItem | null,
    position: DropPosition
  ) => {
    // 如果没有有效的放置位置，不处理
    if (!position || !targetItem) {
      console.log('无效的放置操作');
      return;
    }

    // 不能将文件夹放入自身
    if (dragItem.id === targetItem.id) {
      console.log('不能将文件放入自身');
      return;
    }

    // 如果是放入文件夹操作，目标必须是文件夹
    if (position === 'inside' && targetItem.type !== FileType.FOLDER) {
      console.log('目标不是文件夹，无法放入');
      return;
    }

    setFolderData(prevData => {
      // 深拷贝数据，避免直接修改状态
      const newData = JSON.parse(JSON.stringify(prevData)) as Record<string, FolderData>;

      // 在所有文件夹中查找被拖拽文件所在的源文件夹
      const sourceFolderName = findItemFolder(newData, dragItem.id);
      if (!sourceFolderName) {
        console.log('找不到被拖拽的文件所在的文件夹');
        return prevData;
      }

      const sourceFolderFiles = newData[sourceFolderName].files;

      // 找到被拖拽项在源文件夹中的索引
      const dragIndex = sourceFolderFiles.findIndex(f => f.id === dragItem.id);
      if (dragIndex === -1) {
        console.log('找不到被拖拽的文件');
        return prevData;
      }

      // 从源文件夹中移除被拖拽项
      const [removedItem] = sourceFolderFiles.splice(dragIndex, 1);

      if (position === 'inside') {
        // 放入文件夹操作
        const targetFolderName = targetItem.name;

        // 如果目标文件夹在 folderData 中不存在，创建它
        if (!newData[targetFolderName]) {
          newData[targetFolderName] = {
            name: targetFolderName,
            files: [],
            fileCount: 0,
            folderCount: 0,
          };
        }

        // 将文件添加到目标文件夹
        newData[targetFolderName].files.push(removedItem);

        // 更新目标文件夹的计数
        const targetCounts = calculateCounts(newData[targetFolderName].files);
        newData[targetFolderName].fileCount = targetCounts.fileCount;
        newData[targetFolderName].folderCount = targetCounts.folderCount;

        console.log(`已将 "${removedItem.name}" 从 "${sourceFolderName}" 移入文件夹 "${targetFolderName}"`);
      } else {
        // 排序操作（before 或 after）
        // 查找目标文件所在的文件夹
        const targetFolderName = findItemFolder(newData, targetItem.id);
        if (!targetFolderName) {
          console.log('找不到目标文件所在的文件夹');
          return prevData;
        }

        const targetFolderFiles = newData[targetFolderName].files;
        const targetIndex = targetFolderFiles.findIndex(f => f.id === targetItem.id);
        if (targetIndex === -1) {
          console.log('找不到目标文件');
          return prevData;
        }

        // 计算插入位置
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;

        // 插入到新位置
        targetFolderFiles.splice(insertIndex, 0, removedItem);

        console.log(`已将 "${removedItem.name}" 移动到 "${targetItem.name}" ${position === 'before' ? '前面' : '后面'}`);

        // 如果是跨文件夹移动，更新目标文件夹计数
        if (sourceFolderName !== targetFolderName) {
          const targetCounts = calculateCounts(targetFolderFiles);
          newData[targetFolderName].fileCount = targetCounts.fileCount;
          newData[targetFolderName].folderCount = targetCounts.folderCount;
        }
      }

      // 更新源文件夹的计数
      const sourceCounts = calculateCounts(sourceFolderFiles);
      newData[sourceFolderName].fileCount = sourceCounts.fileCount;
      newData[sourceFolderName].folderCount = sourceCounts.folderCount;

      return newData;
    });
  }, [findItemFolder, calculateCounts]);

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
   * 置顶模式下，内容在右侧面板显示，不覆盖文件列表
   */
  const handleFileClick = (file: FileItem) => {
    if (pinnedMode) {
      // 置顶模式：在右侧面板显示内容
      setPinnedSelectedItem(file);
    } else {
      // 非置顶模式：在当前面板内切换
      if (file.type === FileType.FOLDER) {
        // 进入子文件夹
        if (folderData[file.name]) {
          setFolderPath([...folderPath, file.name]);
        }
      } else {
        // 展示文档详情（动画过渡）
        setSelectedDocument(file);
      }
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
                {/* 文件列表视图 - 置顶模式下始终显示 */}
                <div className={`${styles.fileListView} ${selectedDocument && !pinnedMode ? styles.hidden : ''}`}>
                  {/* 文件夹信息头部 */}
                  <div className={styles.folderHeader}>
                    <FolderIcon size="large" />
                    <div className={styles.folderInfo}>
                      <h2 className={styles.folderTitle}>{currentFolder.name}</h2>
                      <p className={styles.folderMeta}>{currentFolder.fileCount}个文件 | {currentFolder.folderCount}个文件夹</p>
                    </div>
                  </div>

                  {/* 文件列表 - 支持拖拽排序和移入文件夹 */}
                  <FileList
                    files={currentFolder.files}
                    onFileClick={handleFileClick}
                    onDrop={handleFileDrop}
                    childrenMap={childrenMap}
                  />
                </div>

                {/* 文档详情视图 - 非置顶模式下使用 */}
                <div className={`${styles.documentView} ${selectedDocument && !pinnedMode ? styles.visible : ''}`}>
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

      {/* ==================== 置顶模式：内容面板（显示选中的文档或文件夹） ==================== */}
      {pinnedMode && expanded && pinnedSelectedItem && (
        <div className={styles.pinnedContentPanel}>
          {/* 顶部栏 */}
          <div className={styles.pinnedContentHeader}>
            <span className={styles.pinnedContentTitle}>
              {pinnedSelectedItem.name}
            </span>
            <div className={styles.pinnedContentIcons}>
              <TeamOutlined className={styles.pinnedContentIcon} onClick={handleOpenMemberManage} />
              <ExportOutlined className={styles.pinnedContentIcon} />
              <CloseOutlined className={styles.pinnedContentIcon} onClick={() => setPinnedSelectedItem(null)} />
            </div>
          </div>

          {/* 内容区域 */}
          <div className={styles.pinnedContentBody}>
            {pinnedSelectedItem.type === FileType.FOLDER ? (
              // 文件夹内容
              <>
                <div className={styles.folderHeader}>
                  <FolderIcon size="large" />
                  <div className={styles.folderInfo}>
                    <h2 className={styles.folderTitle}>{pinnedSelectedItem.name}</h2>
                    <p className={styles.folderMeta}>
                      {folderData[pinnedSelectedItem.name]?.fileCount || 0}个文件 | {folderData[pinnedSelectedItem.name]?.folderCount || 0}个文件夹
                    </p>
                  </div>
                </div>
                {folderData[pinnedSelectedItem.name] && (
                  <FileList
                    files={folderData[pinnedSelectedItem.name].files}
                    onFileClick={(file) => setPinnedSelectedItem(file)}
                    onDrop={handleFileDrop}
                    childrenMap={childrenMap}
                  />
                )}
              </>
            ) : (
              // 文档内容
              <>
                <div className={styles.documentMeta}>
                  <span>所有者: {pinnedSelectedItem.owner}</span>
                  <span>最近编辑: {pinnedSelectedItem.lastModified}</span>
                </div>
                <div className={styles.documentContent}>
                  <p className={styles.documentPlaceholder}>
                    这里是 {pinnedSelectedItem.name} 文档的内容区域...
                  </p>
                  <p className={styles.documentPlaceholder}>
                    文档内容将在此处显示。
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== 右侧内容区 ==================== */}
      <RightContent />
    </div>
  );
};

export default HomePage;
