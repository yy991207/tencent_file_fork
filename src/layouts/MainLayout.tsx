/**
 * 主布局组件
 * 定义应用的整体布局结构，包括顶部导航、左侧边栏、主内容区和右侧工具栏
 */
import React, { useState, createContext, useContext } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import RightToolbar from '../components/RightToolbar';
import AppPanel from '../components/AppPanel';
import AddFileModal from '../components/AddFileModal';
import styles from './MainLayout.module.less';

const { Content } = Layout;

// 创建右侧边栏上下文
interface RightSidebarContextType {
  isRightSidebarOpen: boolean;
  setIsRightSidebarOpen: (open: boolean) => void;
}

const RightSidebarContext = createContext<RightSidebarContextType>({
  isRightSidebarOpen: false,
  setIsRightSidebarOpen: () => {},
});

export const useRightSidebar = () => useContext(RightSidebarContext);

const MainLayout: React.FC = () => {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  return (
    <RightSidebarContext.Provider value={{ isRightSidebarOpen, setIsRightSidebarOpen }}>
      <Layout className={styles.mainLayout}>
        {/* 顶部导航栏 */}
        <TopHeader />

        {/* 主体内容区域 */}
        <Layout className={`${styles.bodyLayout} ${isRightSidebarOpen ? styles.rightSidebarOpen : ''}`}>
          {/* 主内容区 - 通过 Outlet 渲染子路由组件 */}
          <Content className={styles.mainContent}>
            <Outlet />
          </Content>

          {/* 右侧工具栏 */}
          <RightToolbar />

          {/* 右侧边栏（替代 Drawer） */}
          <div className={`${styles.rightSidebar} ${isRightSidebarOpen ? styles.open : ''}`}>
            <AppPanel
              onClose={() => setIsRightSidebarOpen(false)}
            />
          </div>
        </Layout>

        {/* ==================== 全局弹窗组件 ==================== */}
        {/* 添加资料弹窗 */}
        <AddFileModal />

        {/*
          注意：成员管理抽屉 MemberManageDrawer 不在此处渲染
          它需要相对于左侧面板定位，所以在 DirectoryPage 中渲染
        */}
      </Layout>
    </RightSidebarContext.Provider>
  );
};

export default MainLayout;
