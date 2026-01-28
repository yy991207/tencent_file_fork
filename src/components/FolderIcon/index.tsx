/**
 * 文件夹图标组件
 * 根据设计稿样式渲染文件夹图标
 */
import React from 'react';
import styles from './index.module.less';

interface FolderIconProps {
  size?: 'small' | 'medium' | 'large';  // 图标尺寸
  className?: string;                    // 自定义类名
}

/**
 * 根据尺寸获取图标大小配置
 */
const getSizeConfig = (size: FolderIconProps['size']) => {
  switch (size) {
    case 'small':
      return { width: 20, height: 16, tabWidth: 8, tabHeight: 5 };
    case 'large':
      return { width: 56, height: 48, tabWidth: 20, tabHeight: 12 };
    case 'medium':
    default:
      return { width: 40, height: 32, tabWidth: 14, tabHeight: 8 };
  }
};

const FolderIcon: React.FC<FolderIconProps> = ({ size = 'medium', className }) => {
  const config = getSizeConfig(size);

  return (
    <div
      className={`${styles.folderIcon} ${className || ''}`}
      style={{ width: config.width, height: config.height }}
    >
      {/* 文件夹标签部分 - 深蓝色 */}
      <div
        className={styles.folderTab}
        style={{
          width: config.tabWidth,
          height: config.tabHeight,
        }}
      />
      {/* 文件夹主体部分 - 浅蓝色 */}
      <div
        className={styles.folderBody}
        style={{
          width: config.width,
          height: config.height - config.tabHeight + 2,
          top: config.tabHeight - 2,
        }}
      />
    </div>
  );
};

export default FolderIcon;
