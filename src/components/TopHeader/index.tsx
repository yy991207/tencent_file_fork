/**
 * 顶部导航栏组件
 * 显示应用Logo、导航标题和用户操作区域
 */
import React from 'react';
import { Space, Button, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  MenuOutlined,
  TeamOutlined,
  ShareAltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import styles from './index.module.less';

const TopHeader: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();

  /**
   * 用户下拉菜单配置
   */
  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: '个人中心' },
    { key: 'settings', label: '设置' },
    { type: 'divider' },
    { key: 'logout', label: '退出登录' },
  ];

  /**
   * 处理返回首页
   */
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <header className={styles.topHeader}>
      {/* 左侧Logo和标题区域 */}
      <div className={styles.leftSection}>
        <HomeOutlined className={styles.homeIcon} onClick={handleGoHome} />
        <span className={styles.title}>个人空间</span>
      </div>

      {/* 右侧操作区域 */}
      <div className={styles.rightSection}>
        <Space size={16}>
          {/* 菜单按钮 */}
          <MenuOutlined className={styles.actionIcon} />

          {/* 团队协作按钮 */}
          <TeamOutlined className={styles.actionIcon} />

          {/* 分享按钮 */}
          <Button type="primary" icon={<ShareAltOutlined />}>
            分享
          </Button>

          {/* 用户头像下拉菜单 */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar
              className={styles.userAvatar}
              icon={<UserOutlined />}
              src={currentUser?.avatar}
            />
          </Dropdown>
        </Space>
      </div>
    </header>
  );
};

export default TopHeader;
