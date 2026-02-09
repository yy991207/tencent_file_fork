/**
 * 文件列表组件
 * 显示文件夹内的文件和子文件夹列表
 * 支持拖拽排序和放入文件夹功能，带有完整的视觉反馈系统
 * 支持文件夹展开/折叠查看子文件
 * 支持更多操作菜单（三点按钮）
 */
import React, { useState, useCallback, useRef } from 'react';
import { Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  CaretRightOutlined,
  CaretDownOutlined,
  MoreOutlined,
  FolderAddOutlined,
  ExportOutlined,
  ShareAltOutlined,
  LinkOutlined,
  EditOutlined,
  DragOutlined,
  CopyOutlined,
  AppstoreAddOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { FileItem, FileType } from '../../types';
import FolderIcon from '../FolderIcon';
import styles from './index.module.less';

/**
 * 拖拽放置位置类型
 * - 'inside': 放入文件夹内部（仅对文件夹有效）
 * - 'before': 插入到目标元素之前
 * - 'after': 插入到目标元素之后
 * - null: 无有效放置位置
 */
type DropPosition = 'inside' | 'before' | 'after' | null;

/**
 * 拖拽状态接口
 */
interface DragState {
  dragItem: FileItem | null;        // 当前被拖拽的项目
  dropTargetId: string | null;      // 放置目标的ID
  dropPosition: DropPosition;       // 放置位置
}

interface FileListProps {
  files: FileItem[];                          // 文件列表数据
  onFileClick?: (file: FileItem) => void;     // 文件点击回调
  onFolderClick?: (folder: FileItem) => void; // 文件夹点击回调
  selectedKeys?: string[];                     // 选中的文件ID
  onSelectionChange?: (keys: string[]) => void; // 选择变化回调
  onDrop?: (dragItem: FileItem, targetItem: FileItem | null, position: DropPosition) => void; // 拖拽完成回调
  level?: number;                              // 嵌套层级（用于缩进）
  childrenMap?: Record<string, FileItem[]>;   // 子文件映射（文件夹名 -> 子文件列表）
}

/**
 * 边缘检测阈值（像素）
 * 当鼠标位于目标元素上下边缘此范围内时，触发插入排序效果
 */
const EDGE_THRESHOLD = 8;

const FileList: React.FC<FileListProps> = ({
  files,
  onFileClick,
  onFolderClick,
  selectedKeys = [],
  onSelectionChange,
  onDrop,
  level = 0,
  childrenMap = {},
}) => {
  // 拖拽状态管理
  const [dragState, setDragState] = useState<DragState>({
    dragItem: null,
    dropTargetId: null,
    dropPosition: null,
  });

  // 展开的文件夹ID集合
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // 当前悬停的行 ID（用于显示三点按钮）
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // 当前打开下拉菜单的行 ID（用于控制 Tooltip 显示）
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // 用于存储每个行元素的引用
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  /**
   * 生成文件夹的更多操作菜单
   */
  const getFolderMenuItems = useCallback((_item: FileItem): MenuProps['items'] => {
    return [
      {
        key: 'newFolder',
        icon: <FolderAddOutlined />,
        label: '新建文件夹',
      },
      {
        key: 'openInNewTab',
        icon: <ExportOutlined />,
        label: '新标签页打开',
      },
      {
        type: 'divider',
      },
      {
        key: 'share',
        icon: <ShareAltOutlined />,
        label: '分享',
      },
      {
        key: 'copyLink',
        icon: <LinkOutlined />,
        label: '复制链接',
      },
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: '重命名',
      },
    ];
  }, []);

  /**
   * 生成文件的更多操作菜单
   */
  const getFileMenuItems = useCallback((_item: FileItem): MenuProps['items'] => {
    return [
      {
        key: 'openInNewTab',
        icon: <ExportOutlined />,
        label: '新标签页打开',
      },
      {
        type: 'divider',
      },
      {
        key: 'share',
        icon: <ShareAltOutlined />,
        label: '分享',
      },
      {
        key: 'copyLink',
        icon: <LinkOutlined />,
        label: '复制链接',
      },
      {
        type: 'divider',
      },
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: '重命名',
      },
      {
        key: 'moveTo',
        icon: <DragOutlined />,
        label: '移动到',
      },
      {
        key: 'copyTo',
        icon: <CopyOutlined />,
        label: '生成副本到',
      },
      {
        key: 'addShortcut',
        icon: <AppstoreAddOutlined />,
        label: '添加快捷方式到',
      },
      {
        type: 'divider',
      },
      {
        key: 'download',
        icon: <DownloadOutlined />,
        label: '下载',
      },
    ];
  }, []);

  /**
   * 处理菜单点击
   */
  const handleMenuClick = useCallback((key: string, item: FileItem) => {
    console.log(`菜单操作: ${key}, 文件: ${item.name}`);
    // TODO: 根据 key 执行相应操作
    switch (key) {
      case 'newFolder':
        console.log('新建文件夹');
        break;
      case 'openInNewTab':
        console.log('新标签页打开');
        break;
      case 'share':
        console.log('分享');
        break;
      case 'copyLink':
        console.log('复制链接');
        break;
      case 'rename':
        console.log('重命名');
        break;
      case 'moveTo':
        console.log('移动到');
        break;
      case 'copyTo':
        console.log('生成副本到');
        break;
      case 'addShortcut':
        console.log('添加快捷方式到');
        break;
      case 'download':
        console.log('下载');
        break;
      default:
        break;
    }
  }, []);

  /**
   * 切换文件夹展开/折叠状态
   */
  const toggleFolderExpand = useCallback((folderId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止触发行点击事件
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  /**
   * 根据文件类型渲染图标
   */
  const renderFileIcon = (type: FileType) => {
    if (type === FileType.FOLDER) {
      return <FolderIcon size="small" />;
    }
    // 文档类型图标 - 蓝色背景的M图标
    return (
      <div className={styles.docIcon}>
        <span>M</span>
      </div>
    );
  };

  /**
   * 计算放置位置
   * 根据鼠标在目标元素中的垂直位置，判断是放入文件夹还是插入排序
   */
  const calculateDropPosition = useCallback((
    event: React.DragEvent<HTMLDivElement>,
    targetItem: FileItem
  ): DropPosition => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseY = event.clientY;
    const relativeY = mouseY - rect.top;
    const height = rect.height;

    // 上边缘区域：触发 "before" 插入
    if (relativeY < EDGE_THRESHOLD) {
      return 'before';
    }

    // 下边缘区域：触发 "after" 插入
    if (relativeY > height - EDGE_THRESHOLD) {
      return 'after';
    }

    // 中间区域：如果目标是文件夹，触发 "inside" 放入；否则无效
    if (targetItem.type === FileType.FOLDER) {
      return 'inside';
    }

    // 对于非文件夹项目，中间区域也按距离判断插入位置
    return relativeY < height / 2 ? 'before' : 'after';
  }, []);

  /**
   * 开始拖拽
   * 将文件信息序列化存入 dataTransfer，支持跨层级拖拽
   */
  const handleDragStart = useCallback((
    event: React.DragEvent<HTMLDivElement>,
    item: FileItem
  ) => {
    // 设置拖拽数据，将完整的文件信息序列化存入 dataTransfer
    // 这样跨层级拖拽时也能获取到拖拽的文件信息
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.setData('text/plain', item.id);

    // 更新拖拽状态（用于当前组件内的视觉反馈）
    setDragState({
      dragItem: item,
      dropTargetId: null,
      dropPosition: null,
    });

    // 添加拖拽时的视觉效果（稍微透明）
    const target = event.currentTarget;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  }, []);

  /**
   * 拖拽结束
   */
  const handleDragEnd = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    // 恢复透明度
    event.currentTarget.style.opacity = '1';

    // 重置拖拽状态
    setDragState({
      dragItem: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }, []);

  /**
   * 拖拽经过目标元素
   */
  const handleDragOver = useCallback((
    event: React.DragEvent<HTMLDivElement>,
    targetItem: FileItem
  ) => {
    event.preventDefault();
    event.stopPropagation();

    // 不允许拖拽到自身
    if (dragState.dragItem?.id === targetItem.id) {
      setDragState(prev => ({
        ...prev,
        dropTargetId: null,
        dropPosition: null,
      }));
      return;
    }

    // 计算放置位置
    const position = calculateDropPosition(event, targetItem);

    // 更新拖拽状态（仅在变化时更新，避免不必要的重渲染）
    if (dragState.dropTargetId !== targetItem.id || dragState.dropPosition !== position) {
      setDragState(prev => ({
        ...prev,
        dropTargetId: targetItem.id,
        dropPosition: position,
      }));
    }

    // 设置拖拽效果
    event.dataTransfer.dropEffect = 'move';
  }, [dragState.dragItem, dragState.dropTargetId, dragState.dropPosition, calculateDropPosition]);

  /**
   * 拖拽离开目标元素
   */
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    // 检查是否真的离开了元素（而不是进入子元素）
    const relatedTarget = event.relatedTarget as Node;
    if (event.currentTarget.contains(relatedTarget)) {
      return;
    }

    // 清除放置目标状态
    setDragState(prev => ({
      ...prev,
      dropTargetId: null,
      dropPosition: null,
    }));
  }, []);

  /**
   * 放置到目标位置
   * 优先从 dataTransfer 读取拖拽数据，支持跨层级拖拽
   */
  const handleDrop = useCallback((
    event: React.DragEvent<HTMLDivElement>,
    targetItem: FileItem
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const { dropPosition } = dragState;

    // 优先从 dataTransfer 获取拖拽的文件信息（支持跨层级拖拽）
    let dragItem: FileItem | null = dragState.dragItem;
    const jsonData = event.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        dragItem = JSON.parse(jsonData) as FileItem;
      } catch (e) {
        console.error('解析拖拽数据失败:', e);
      }
    }

    // 验证拖拽数据
    if (!dragItem || dragItem.id === targetItem.id || !dropPosition) {
      console.log('拖拽验证失败:', { dragItem: !!dragItem, sameId: dragItem?.id === targetItem.id, dropPosition });
      return;
    }

    // 触发回调
    onDrop?.(dragItem, targetItem, dropPosition);

    // 重置状态
    setDragState({
      dragItem: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }, [dragState, onDrop]);

  /**
   * 处理行点击事件
   */
  const handleRowClick = useCallback((record: FileItem) => {
    if (record.type === FileType.FOLDER) {
      onFolderClick?.(record);
    } else {
      onFileClick?.(record);
    }
  }, [onFileClick, onFolderClick]);

  /**
   * 处理选择变化
   */
  const handleSelectionChange = useCallback((itemId: string, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedKeys, itemId]);
    } else {
      onSelectionChange(selectedKeys.filter(key => key !== itemId));
    }
  }, [selectedKeys, onSelectionChange]);

  /**
   * 获取行的 CSS 类名
   * 根据拖拽状态决定是否添加高亮效果
   */
  const getRowClassName = useCallback((item: FileItem): string => {
    const classes = [styles.tableRow];

    // 检查是否为选中状态
    if (selectedKeys.includes(item.id)) {
      classes.push(styles.selected);
    }

    // 检查是否为拖拽目标且是"放入文件夹"效果
    if (
      dragState.dropTargetId === item.id &&
      dragState.dropPosition === 'inside' &&
      item.type === FileType.FOLDER
    ) {
      classes.push(styles.dropInside);
    }

    return classes.join(' ');
  }, [dragState.dropTargetId, dragState.dropPosition, selectedKeys]);

  /**
   * 渲染插入指示线
   * 仅当拖拽状态为 'before' 或 'after' 时显示
   */
  const renderDropIndicator = useCallback((item: FileItem, position: 'before' | 'after') => {
    const isActive =
      dragState.dropTargetId === item.id &&
      dragState.dropPosition === position;

    if (!isActive) {
      return null;
    }

    return (
      <div
        className={`${styles.dropIndicator} ${position === 'before' ? styles.dropIndicatorBefore : styles.dropIndicatorAfter}`}
      >
        <div className={styles.dropIndicatorDot} />
        <div className={styles.dropIndicatorLine} />
      </div>
    );
  }, [dragState.dropTargetId, dragState.dropPosition]);

  /**
   * 渲染展开/折叠按钮
   * 仅对文件夹显示
   */
  const renderExpandButton = (item: FileItem) => {
    if (item.type !== FileType.FOLDER) {
      // 非文件夹显示占位符保持对齐
      return <div className={styles.expandPlaceholder} />;
    }

    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = childrenMap[item.name] && childrenMap[item.name].length > 0;

    return (
      <div
        className={`${styles.expandButton} ${hasChildren ? '' : styles.expandButtonHidden}`}
        onClick={(e) => toggleFolderExpand(item.id, e)}
      >
        {isExpanded ? (
          <CaretDownOutlined className={styles.expandIcon} />
        ) : (
          <CaretRightOutlined className={styles.expandIcon} />
        )}
      </div>
    );
  };

  /**
   * 渲染子文件列表
   */
  const renderChildren = (item: FileItem) => {
    if (item.type !== FileType.FOLDER || !expandedFolders.has(item.id)) {
      return null;
    }

    const children = childrenMap[item.name];
    if (!children || children.length === 0) {
      return null;
    }

    return (
      <div className={styles.childrenContainer}>
        <FileList
          files={children}
          onFileClick={onFileClick}
          onFolderClick={onFolderClick}
          selectedKeys={selectedKeys}
          onSelectionChange={onSelectionChange}
          onDrop={onDrop}
          level={level + 1}
          childrenMap={childrenMap}
        />
      </div>
    );
  };

  return (
    <div className={styles.fileList}>
      {/* 表头（仅在顶层显示） */}
      {level === 0 && (
        <div className={styles.tableHeader}>
          {onSelectionChange && (
            <div className={styles.checkboxCell}>
              {/* 全选复选框可以在这里添加 */}
            </div>
          )}
          <div className={styles.nameHeader}>名称</div>
          <div className={styles.ownerHeader}>所有者</div>
          <div className={styles.timeHeader}>最近编辑</div>
        </div>
      )}

      {/* 文件列表 */}
      <div className={styles.tableBody}>
        {files.map((item) => (
          <div key={item.id} className={styles.rowWrapper}>
            {/* 上方插入指示线 */}
            {renderDropIndicator(item, 'before')}

            {/* 文件行 */}
            <div
              ref={(el) => {
                if (el) {
                  rowRefs.current.set(item.id, el);
                } else {
                  rowRefs.current.delete(item.id);
                }
              }}
              className={getRowClassName(item)}
              style={{ paddingLeft: `${12 + level * 24}px` }}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, item)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item)}
              onClick={() => handleRowClick(item)}
              onMouseEnter={() => setHoveredRowId(item.id)}
              onMouseLeave={() => setHoveredRowId(null)}
            >
              {/* 复选框列 */}
              {onSelectionChange && (
                <div
                  className={styles.checkboxCell}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(item.id)}
                    onChange={(e) => handleSelectionChange(item.id, e.target.checked)}
                  />
                </div>
              )}

              {/* 展开/折叠按钮 */}
              {renderExpandButton(item)}

              {/* 名称列 */}
              <div className={styles.nameCell}>
                {renderFileIcon(item.type)}
                <span className={styles.fileName}>{item.name}</span>
              </div>

              {/* 所有者列 */}
              <div className={styles.ownerCell}>
                <span className={styles.ownerText}>{item.owner}</span>
              </div>

              {/* 时间列 */}
              <div className={styles.timeCell}>
                <span className={styles.timeText}>{item.lastModified}</span>
              </div>

              {/* 更多操作按钮（三点按钮） */}
              <div
                className={`${styles.moreActionsCell} ${hoveredRowId === item.id ? styles.visible : ''}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Dropdown
                  menu={{
                    items: item.type === FileType.FOLDER
                      ? getFolderMenuItems(item)
                      : getFileMenuItems(item),
                    onClick: ({ key }) => handleMenuClick(key, item),
                  }}
                  trigger={['click']}
                  placement="bottomRight"
                  onOpenChange={(open) => setOpenDropdownId(open ? item.id : null)}
                >
                  <Tooltip
                    title="更多操作"
                    placement="top"
                    open={openDropdownId === item.id ? false : undefined}
                  >
                    <div className={styles.moreButton}>
                      <MoreOutlined />
                    </div>
                  </Tooltip>
                </Dropdown>
              </div>
            </div>

            {/* 下方插入指示线 */}
            {renderDropIndicator(item, 'after')}

            {/* 子文件列表（展开时显示） */}
            {renderChildren(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
