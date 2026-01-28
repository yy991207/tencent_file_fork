/**
 * 文档编辑页面
 * 用于显示和编辑单个文档的内容
 */
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import RightContent from '../../components/RightContent';
import styles from './index.module.less';

const DocumentEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /**
   * 返回上一页
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * 保存文档
   */
  const handleSave = () => {
    // TODO: 实现文档保存逻辑
    console.log('保存文档:', id);
  };

  return (
    <div className={styles.documentEditPage}>
      {/* ==================== 左侧编辑区域 ==================== */}
      <div className={styles.editorPanel}>
        {/* 顶部工具栏 */}
        <div className={styles.toolbar}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            返回
          </Button>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              保存
            </Button>
          </Space>
        </div>

        {/* 文档标题 */}
        <div className={styles.titleArea}>
          <input
            type="text"
            className={styles.titleInput}
            placeholder="请输入文档标题"
            defaultValue={`文档 ${id}`}
          />
        </div>

        {/* 编辑区域 */}
        <div className={styles.editorArea}>
          <textarea
            className={styles.editor}
            placeholder="开始编辑文档内容..."
          />
        </div>
      </div>

      {/* ==================== 右侧内容区 ==================== */}
      <RightContent />
    </div>
  );
};

export default DocumentEditPage;
