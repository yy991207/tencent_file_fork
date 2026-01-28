/**
 * 右侧内容区组件
 * 显示问问空间、个人空间信息和AI问答输入框
 */
import React from 'react';
import { Button } from 'antd';
import {
  MessageOutlined,
  ClockCircleOutlined,
  LayoutOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';

interface RightContentProps {
  spaceName?: string;            // 空间名称
  creator?: string;              // 创建者
  contentCount?: number;         // 内容数量
}

const RightContent: React.FC<RightContentProps> = ({
  spaceName = '个人空间',
  creator = 'Echo',
  contentCount = 7,
}) => {
  return (
    <div className={styles.rightContent}>
      {/* ==================== 顶部导航栏 ==================== */}
      <div className={styles.topNav}>
        <div className={styles.navLeft}>
          <div className={styles.logoCircle} />
          <span className={styles.logoText}>问问空间</span>
        </div>
        <div className={styles.navRight}>
          <Button type="text" icon={<MessageOutlined />}>
            新会话
          </Button>
          <ClockCircleOutlined className={styles.navIcon} />
          <LayoutOutlined className={styles.navIcon} />
        </div>
      </div>

      {/* ==================== 主内容区域 ==================== */}
      <div className={styles.mainArea}>
        {/* 大卡片 - 个人空间信息 */}
        <div className={styles.heroCard}>
          <h2 className={styles.heroTitle}>{spaceName}</h2>
          <p className={styles.heroSubtitle}>
            {creator} 创建 · {contentCount}个内容
          </p>
        </div>

        {/* 占位区域 */}
        <div className={styles.spacer} />

        {/* AI问答输入框 */}
        <div className={styles.inputCard}>
          <div className={styles.inputLine} />
          <div className={styles.inputContent}>
            <p className={styles.inputTitle}>
              基于个人空间的1个资料来源问问AI
            </p>
            <p className={styles.inputSubtitle}>基于1个资料回答</p>
          </div>
          <Button
            type="primary"
            shape="circle"
            icon={<ArrowRightOutlined />}
            className={styles.sendButton}
          />
        </div>
      </div>
    </div>
  );
};

export default RightContent;
