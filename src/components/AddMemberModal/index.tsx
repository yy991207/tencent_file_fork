/**
 * 添加成员弹窗组件
 * 用于选择协作人添加到文件夹
 */
import React, { useState } from 'react';
import { Modal, Tabs, Avatar, Checkbox, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import styles from './index.module.less';

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
}

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedFriends: Friend[]) => void;
}

/**
 * 模拟好友数据
 */
const mockFriends: Friend[] = [
  { id: '1', name: 'Echo', description: '最近协作' },
  { id: '2', name: '张小明', description: '最近协作' },
  { id: '3', name: '洛神（想吃火锅版）', description: '管理部门·管理专员' },
];

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /**
   * 处理选择变化
   */
  const handleSelectChange = (friendId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, friendId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== friendId));
    }
  };

  /**
   * 处理确认
   */
  const handleConfirm = () => {
    const selectedFriends = mockFriends.filter(f => selectedIds.includes(f.id));
    onConfirm(selectedFriends);
    setSelectedIds([]);
  };

  /**
   * 处理关闭
   */
  const handleClose = () => {
    setSelectedIds([]);
    onClose();
  };

  const tabItems = [
    {
      key: 'recent',
      label: '最近协作',
      children: (
        <div className={styles.friendList}>
          {mockFriends.slice(0, 2).map(friend => (
            <div key={friend.id} className={styles.friendItem}>
              <Checkbox
                checked={selectedIds.includes(friend.id)}
                onChange={(e) => handleSelectChange(friend.id, e.target.checked)}
              />
              <Avatar size={32} className={styles.friendAvatar}>
                {friend.name.charAt(0)}
              </Avatar>
              <span className={styles.friendName}>{friend.name}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'contacts',
      label: '我的好友',
      children: (
        <div className={styles.friendList}>
          {mockFriends.map(friend => (
            <div key={friend.id} className={styles.friendItem}>
              <Checkbox
                checked={selectedIds.includes(friend.id)}
                onChange={(e) => handleSelectChange(friend.id, e.target.checked)}
              />
              <Avatar size={32} className={styles.friendAvatar}>
                {friend.name.charAt(0)}
              </Avatar>
              <div className={styles.friendInfo}>
                <span className={styles.friendName}>{friend.name}</span>
                {friend.description && (
                  <span className={styles.friendDesc}>{friend.description}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'group',
      label: '群组织架构',
      children: <div className={styles.emptyContent}>暂无数据</div>,
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      closable={false}
      width={500}
      className={styles.addMemberModal}
      centered
    >
      {/* 弹窗头部 */}
      <div className={styles.modalHeader}>
        <span className={styles.modalTitle}>选择协作人</span>
        <CloseOutlined className={styles.closeIcon} onClick={handleClose} />
      </div>

      {/* 标签栏 */}
      <Tabs items={tabItems} className={styles.tabs} />

      {/* 已选择区域 */}
      {selectedIds.length > 0 && (
        <div className={styles.selectedArea}>
          <span className={styles.selectedLabel}>已选择 {selectedIds.length} 人</span>
          <div className={styles.selectedAvatars}>
            {selectedIds.map(id => {
              const friend = mockFriends.find(f => f.id === id);
              return friend ? (
                <Avatar key={id} size={24} className={styles.selectedAvatar}>
                  {friend.name.charAt(0)}
                </Avatar>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* 底部按钮 */}
      <div className={styles.modalFooter}>
        <Button
          type="primary"
          onClick={handleConfirm}
          disabled={selectedIds.length === 0}
          className={styles.confirmBtn}
        >
          确定
        </Button>
      </div>
    </Modal>
  );
};

export default AddMemberModal;
