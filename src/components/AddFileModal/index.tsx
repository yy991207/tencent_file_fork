/**
 * 添加资料弹窗组件
 * 用于上传文件、从云端选择或其他方式添加资料
 * 对应设计稿中的"添加资料"弹窗页面
 */
import React from 'react';
import { Modal, Button } from 'antd';
import {
  MessageOutlined,
  CloudOutlined,
  FileTextOutlined,
  ScissorOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import styles from './index.module.less';

const AddFileModal: React.FC = () => {
  const { activeModal, setActiveModal } = useAppStore();

  // 判断弹窗是否打开
  const isOpen = activeModal === 'addFile';

  /**
   * 关闭弹窗
   */
  const handleClose = () => {
    setActiveModal(null);
  };

  /**
   * 处理选择文件
   */
  const handleSelectFile = () => {
    // TODO: 实现文件选择逻辑
    console.log('选择文件');
  };

  /**
   * 处理选择文件夹
   */
  const handleSelectFolder = () => {
    // TODO: 实现文件夹选择逻辑
    console.log('选择文件夹');
  };

  return (
    <Modal
      title="添加资料"
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={750}
      centered
      className={styles.addFileModal}
    >
      {/* ==================== 拖拽上传区域 ==================== */}
      <div className={styles.uploadArea}>
        <div className={styles.uploadBox}>
          {/* 上传标题 */}
          <h3 className={styles.uploadTitle}>拖拽文件到这里可快速上传</h3>

          {/* 上传说明 */}
          <p className={styles.uploadSubtitle}>
            支持上传任意类型文件，如文档、文件夹、图片和音视频、压缩包等
          </p>

          {/* 文件夹图标 */}
          <div className={styles.folderIconWrapper}>
            <div className={styles.folderBack} />
            <div className={styles.folderTab} />
            <div className={styles.folderFront} />
          </div>

          {/* 选择文件按钮 */}
          <Button
            type="primary"
            size="large"
            className={styles.selectFileBtn}
            onClick={handleSelectFile}
          >
            选择文件
          </Button>

          {/* 选择文件夹链接 */}
          <a className={styles.selectFolderLink} onClick={handleSelectFolder}>
            选择文件夹
          </a>
        </div>
      </div>

      {/* ==================== 底部选项卡片区域 ==================== */}
      <div className={styles.optionCards}>
        {/* 从聊天文件选择 */}
        <div className={styles.optionCard}>
          <h4 className={styles.cardTitle}>从聊天文件选择</h4>
          <div className={styles.cardButtons}>
            <Button icon={<MessageOutlined style={{ color: '#07C160' }} />}>
              微信
            </Button>
          </div>
        </div>

        {/* 从云端选择 */}
        <div className={styles.optionCard}>
          <h4 className={styles.cardTitle}>从云端选择</h4>
          <div className={styles.cardButtons}>
            <Button icon={<CloudOutlined style={{ color: '#4A90D9' }} />}>
              微云
            </Button>
            <Button icon={<FileTextOutlined style={{ color: '#4A90D9' }} />}>
              腾讯文档
            </Button>
          </div>
        </div>

        {/* 其它方式 */}
        <div className={styles.optionCard}>
          <h4 className={styles.cardTitle}>其它方式</h4>
          <div className={styles.cardButtons}>
            <Button icon={<ScissorOutlined />}>网页剪存</Button>
            <Button icon={<CopyOutlined />}>粘贴文本</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddFileModal;
