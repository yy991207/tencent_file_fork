/**
 * 应用主组件
 * 负责路由配置和整体布局结构
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import DocumentEditPage from './pages/DocumentEditPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 主布局路由，所有页面共享相同的布局结构 */}
        <Route path="/" element={<MainLayout />}>
          {/* 首页 - 包含收起、展开、目录树三种状态，通过动画切换 */}
          <Route index element={<HomePage />} />
          {/* 文档编辑页面 - 打开文档进入编辑状态 */}
          <Route path="document/:id" element={<DocumentEditPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
