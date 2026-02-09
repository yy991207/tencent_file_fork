/**
 * 应用面板侧边栏组件
 * 从右侧滑出的应用面板，包含各种AI应用工具入口
 */
import React, { useState } from 'react';
import { Button, Space, Card, List, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  AudioOutlined,
  FilePptOutlined,
  HighlightOutlined,
  ReadOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  BranchesOutlined,
  FormOutlined,
  FileImageOutlined,
  TableOutlined,
  FileTextOutlined,
  PlusOutlined,
  CloseOutlined,
  EditOutlined,
  MoreOutlined,
  DownOutlined,
  FileOutlined,
  FileMarkdownOutlined,
  ProfileOutlined,
  FundProjectionScreenOutlined,
  ApartmentOutlined,
  PartitionOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';

interface AppPanelProps {
  onClose: () => void;
}

interface ContentItem {
  key: string;
  icon: React.ReactNode;
  title: string;
  time: string;
}

/**
 * 应用工具数据
 */
const appTools = [
  {
    key: 'podcast',
    icon: <AudioOutlined className={styles.toolIcon} style={{ color: '#52c41a' }} />,
    title: '播客',
    desc: '轻松听懂资料',
  },
  {
    key: 'ppt',
    icon: <FilePptOutlined className={styles.toolIcon} style={{ color: '#fa8c16' }} />,
    title: 'PPT',
    desc: '高效汇报和...',
  },
  {
    key: 'highlight',
    icon: <HighlightOutlined className={styles.toolIcon} style={{ color: '#f5222d' }} />,
    title: '重点提炼',
    desc: '提取核心干货',
  },
  {
    key: 'outline',
    icon: <ReadOutlined className={styles.toolIcon} style={{ color: '#1890ff' }} />,
    title: '学习大纲',
    desc: '梳理学习路径',
  },
  {
    key: 'quiz',
    icon: <CheckCircleOutlined className={styles.toolIcon} style={{ color: '#722ed1' }} />,
    title: '测验',
    desc: '自测掌握程度',
  },
  {
    key: 'card',
    icon: <CreditCardOutlined className={styles.toolIcon} style={{ color: '#eb2f96' }} />,
    title: '记忆卡片',
    desc: '碎片时间记忆',
  },
  {
    key: 'mindmap',
    icon: <BranchesOutlined className={styles.toolIcon} style={{ color: '#13c2c2' }} />,
    title: '思维导图',
    desc: '可视化知识结构',
  },
];

/**
 * 创作内容初始数据
 */
const initialRecentContent: ContentItem[] = [
  { key: '1', icon: <FormOutlined />, title: '无标题收集表', time: '10 分钟前' },
  { key: '2', icon: <FileImageOutlined />, title: '无标题幻灯片', time: '11 分钟前' },
  { key: '3', icon: <TableOutlined />, title: '无标题表格', time: '11 分钟前' },
  { key: '4', icon: <FileTextOutlined />, title: '无标题文档', time: '11 分钟前' },
  { key: '5', icon: <FormOutlined />, title: '无标题收集表', time: '2月7日' },
];

/**
 * 新建笔记下拉菜单项
 */
const newNoteMenuItems: MenuProps['items'] = [
  {
    key: 'professional',
    label: '专业文档',
    type: 'group',
    children: [
      { key: 'doc', icon: <FileOutlined style={{ color: '#1890ff' }} />, label: '文档' },
      { key: 'table', icon: <TableOutlined style={{ color: '#52c41a' }} />, label: '表格' },
      { key: 'slide', icon: <FundProjectionScreenOutlined style={{ color: '#fa8c16' }} />, label: '幻灯片' },
    ],
  },
  {
    type: 'divider',
  },
  {
    key: 'innovation',
    label: '创新文档',
    type: 'group',
    children: [
      { key: 'collect', icon: <ProfileOutlined style={{ color: '#faad14' }} />, label: '收集表' },
      { key: 'smart-table', icon: <ApartmentOutlined style={{ color: '#13c2c2' }} />, label: '智能表格' },
      { key: 'mindmap', icon: <PartitionOutlined style={{ color: '#eb2f96' }} />, label: '思维导图' },
      { key: 'flowchart', icon: <PartitionOutlined style={{ color: '#722ed1' }} />, label: '流程图' },
      { key: 'whiteboard', icon: <BuildOutlined style={{ color: '#f5222d' }} />, label: '智能白板' },
      { key: 'markdown', icon: <FileMarkdownOutlined style={{ color: '#595959' }} />, label: 'Markdown' },
    ],
  },
];

const AppPanel: React.FC<AppPanelProps> = ({ onClose }) => {
  // 创作内容列表状态
  const [recentContent, setRecentContent] = useState<ContentItem[]>(initialRecentContent);

  /**
   * 获取内容项的操作菜单
   */
  const getContentMenuItems = (_itemKey: string): MenuProps['items'] => [
    { key: 'convert', label: '转换为资料' },
    { key: 'open-new', label: '新标签页打开' },
    { type: 'divider' },
    { key: 'share', label: '分享' },
    { key: 'copy-link', label: '复制链接' },
    { key: 'download', label: '下载' },
    { type: 'divider' },
    { key: 'rename', label: '重命名' },
    { key: 'move', label: '移动到' },
    { key: 'copy', label: '生成副本到' },
    { key: 'shortcut', label: '添加快捷方式到' },
    { type: 'divider' },
    { key: 'delete', label: '删除', danger: true },
  ];

  /**
   * 处理菜单点击
   */
  const handleMenuClick = (key: string, itemKey: string) => {
    if (key === 'delete') {
      // 删除操作
      setRecentContent(prev => prev.filter(item => item.key !== itemKey));
      console.log(`已删除项目: ${itemKey}`);
    } else {
      console.log(`操作: ${key}, 项目: ${itemKey}`);
    }
  };

  /**
   * 处理新建笔记菜单点击
   */
  const handleNewNoteClick: MenuProps['onClick'] = (e) => {
    console.log('新建:', e.key);
  };

  return (
    <div className={styles.appPanel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>应用</span>
        <Space>
          <Button type="text" icon={<EditOutlined />} className={styles.headerBtn} />
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} className={styles.headerBtn} />
        </Space>
      </div>

      <div className={styles.panelContent}>
        {/* 应用工具网格 */}
        <div className={styles.toolsSection}>
          <div className={styles.toolsGrid}>
            {appTools.map((tool) => (
              <Card
                key={tool.key}
                className={styles.toolCard}
                hoverable
                bodyStyle={{ padding: 12 }}
              >
                <div className={styles.toolItem}>
                  <div className={styles.toolIconWrapper}>
                    {tool.icon}
                    <EditOutlined className={styles.editIcon} />
                  </div>
                  <div className={styles.toolInfo}>
                    <div className={styles.toolTitle}>{tool.title}</div>
                    <div className={styles.toolDesc}>{tool.desc}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 创作内容列表 */}
        <div className={styles.contentSection}>
          <div className={styles.sectionTitle}>创作内容</div>
          <List
            className={styles.contentList}
            dataSource={recentContent}
            renderItem={(item) => (
              <List.Item className={styles.contentItem}>
                <div className={styles.contentIcon}>{item.icon}</div>
                <div className={styles.contentInfo}>
                  <div className={styles.contentTitle}>{item.title}</div>
                  <div className={styles.contentTime}>{item.time}</div>
                </div>
                <Dropdown
                  menu={{
                    items: getContentMenuItems(item.key),
                    onClick: ({ key }) => handleMenuClick(key, item.key),
                  }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    size="small"
                    className={styles.moreBtn}
                    icon={<MoreOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </List.Item>
            )}
          />
        </div>

        {/* 新建笔记按钮 */}
        <div className={styles.footerSection}>
          <Dropdown
            menu={{ items: newNoteMenuItems, onClick: handleNewNoteClick }}
            placement="top"
            trigger={['click']}
          >
            <Button type="text" className={styles.newNoteBtn} icon={<PlusOutlined />}>
              <span className={styles.newNoteText}>新建笔记</span>
              <DownOutlined className={styles.dropdownIcon} />
            </Button>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default AppPanel;
