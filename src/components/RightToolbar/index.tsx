/**
 * 右侧工具栏组件
 * 显示常用工具图标，如文档、扫描、书签等
 */
import React from 'react';
import { Tooltip } from 'antd';
import {
  FileTextOutlined,
  ScanOutlined,
  BookOutlined,
  FileProtectOutlined,
  CheckSquareOutlined,
  ShareAltOutlined,
  EditOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';

/**
 * 工具栏项目配置
 */
interface ToolItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}

const RightToolbar: React.FC = () => {
  /**
   * 顶部工具列表
   */
  const topTools: ToolItem[] = [
    { key: 'file', icon: <FileTextOutlined />, title: '文档' },
    { key: 'scan', icon: <ScanOutlined />, title: '扫描' },
    { key: 'bookmark', icon: <BookOutlined />, title: '书签' },
    { key: 'protect', icon: <FileProtectOutlined />, title: '文件保护' },
    { key: 'check', icon: <CheckSquareOutlined />, title: '待办事项' },
    { key: 'share', icon: <ShareAltOutlined />, title: '分享' },
  ];

  /**
   * 底部工具列表
   */
  const bottomTools: ToolItem[] = [
    { key: 'edit', icon: <EditOutlined />, title: '编辑' },
  ];

  /**
   * 渲染工具图标
   */
  const renderToolIcon = (tool: ToolItem) => (
    <Tooltip key={tool.key} title={tool.title} placement="left">
      <div className={styles.toolIcon} onClick={tool.onClick}>
        {tool.icon}
      </div>
    </Tooltip>
  );

  return (
    <aside className={styles.rightToolbar}>
      {/* 顶部工具区域 */}
      <div className={styles.topTools}>
        {topTools.map(renderToolIcon)}
      </div>

      {/* 占位区域 - 用于撑开上下两部分 */}
      <div className={styles.spacer} />

      {/* 底部工具区域 */}
      <div className={styles.bottomTools}>
        {bottomTools.map(renderToolIcon)}
      </div>
    </aside>
  );
};

export default RightToolbar;
