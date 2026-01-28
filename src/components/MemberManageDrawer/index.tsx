/**
 * 成员管理抽屉组件
 * 用于管理文件夹成员和权限设置
 * 从左侧面板右边界滑入（自定义实现，不使用 Ant Design Drawer）
 */
import React, { useState } from 'react';
import { Button, Select, Avatar, Tooltip } from 'antd';
import {
  CloseOutlined,
  UserAddOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  EllipsisOutlined,
  DownOutlined,
  RightOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import { PermissionType, FolderMember } from '../../types';
import AddMemberModal from '../AddMemberModal';
import styles from './index.module.less';

/**
 * 权限选项配置
 */
const permissionOptions = [
  { value: 'private', label: '仅我可查看' },
  { value: 'specified', label: '指定人可查看' },
  { value: 'viewable', label: '所有人可查看' },
  { value: 'editable', label: '所有人可编辑' },
];

/**
 * 成员权限选项
 */
const memberRoleOptions = [
  { value: 'viewer', label: '查看' },
  { value: 'editor', label: '编辑' },
];

const MemberManageDrawer: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    folderMembers,
    addFolderMember,
    folderPermission,
    setFolderPermission,
    currentUser,
    addMemberModalOpen,
    setAddMemberModalOpen,
  } = useAppStore();

  // 空间成员折叠状态
  const [spaceMembersExpanded, setSpaceMembersExpanded] = useState(true);

  // 判断抽屉是否打开
  const isOpen = activeModal === 'memberManage';

  // 分离文件夹所有者和空间成员
  const ownerMembers = folderMembers.filter(m => m.role === 'owner');
  const spaceMembers = folderMembers.filter(m => m.role !== 'owner');

  /**
   * 关闭抽屉
   */
  const handleClose = () => {
    setActiveModal(null);
  };

  /**
   * 处理权限变更
   */
  const handlePermissionChange = (value: PermissionType) => {
    setFolderPermission(value);
  };

  /**
   * 打开权限设置
   */
  const handleOpenPermissionSettings = () => {
    console.log('打开权限设置');
  };

  /**
   * 添加成员 - 打开添加成员弹窗
   */
  const handleAddMember = () => {
    setAddMemberModalOpen(true);
  };

  /**
   * 处理添加成员确认
   */
  const handleAddMemberConfirm = (selectedFriends: { id: string; name: string }[]) => {
    selectedFriends.forEach((friend, index) => {
      const newMember: FolderMember = {
        id: `member_${Date.now()}_${index}`,
        userId: friend.id,
        userName: friend.name,
        role: 'viewer',
      };
      addFolderMember(newMember);
    });
    // 添加成员后，将权限改为所有人可查看
    if (selectedFriends.length > 0) {
      setFolderPermission('viewable');
    }
    setAddMemberModalOpen(false);
  };

  /**
   * 邀请成员加入
   */
  const handleInviteMember = () => {
    console.log('邀请成员加入');
  };

  /**
   * 切换空间成员折叠状态
   */
  const toggleSpaceMembers = () => {
    setSpaceMembersExpanded(!spaceMembersExpanded);
  };

  return (
    <>
      <div className={`${styles.memberDrawer} ${isOpen ? styles.visible : ''}`}>
        {/* 抽屉头部 */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>文件夹成员管理</span>
          <CloseOutlined className={styles.closeIcon} onClick={handleClose} />
        </div>

        {/* 抽屉内容 */}
        <div className={styles.drawerBody}>
          {/* ==================== 权限设置区域 ==================== */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>文件夹权限</div>
            <div className={styles.permissionRow}>
              {/* 权限下拉选择 */}
              <Select
                value={folderPermission}
                onChange={handlePermissionChange}
                options={permissionOptions}
                className={styles.permissionSelect}
                popupMatchSelectWidth={false}
              />
              {/* 权限设置按钮 */}
              <Button onClick={handleOpenPermissionSettings}>权限设置</Button>
            </div>
          </div>

          {/* ==================== 成员标题区域 ==================== */}
          <div className={styles.memberHeader}>
            <div className={styles.memberTitle}>
              <span>文件夹成员·{folderMembers.length}</span>
              <Tooltip title="成员信息说明">
                <InfoCircleOutlined className={styles.infoIcon} />
              </Tooltip>
            </div>
            <EllipsisOutlined className={styles.moreIcon} />
          </div>

          {/* ==================== 操作按钮区域 ==================== */}
          <div className={styles.actionButtons}>
            <Button icon={<UserAddOutlined />} onClick={handleAddMember}>
              添加成员
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleInviteMember}>
              邀请成员加入
            </Button>
          </div>

          {/* ==================== 成员列表区域 ==================== */}
          <div className={styles.memberList}>
            {/* 文件夹所有者 */}
            {ownerMembers.map((member) => (
              <div key={member.id} className={styles.memberItem}>
                <div className={styles.memberInfo}>
                  <Avatar
                    size={32}
                    className={styles.memberAvatar}
                    src={member.avatar}
                  >
                    {member.userName.charAt(0).toUpperCase()}
                  </Avatar>
                  <span className={styles.memberName}>
                    {member.userName}
                    {member.userId === currentUser?.id && '（我）'}
                  </span>
                </div>
                <span className={styles.memberRole}>文件夹所有者</span>
              </div>
            ))}

            {/* 空间成员分组 */}
            {spaceMembers.length > 0 && (
              <div className={styles.spaceMembersSection}>
                {/* 空间成员标题 */}
                <div className={styles.spaceMembersHeader} onClick={toggleSpaceMembers}>
                  <div className={styles.spaceMembersTitle}>
                    {spaceMembersExpanded ? (
                      <DownOutlined className={styles.expandIcon} />
                    ) : (
                      <RightOutlined className={styles.expandIcon} />
                    )}
                    <TeamOutlined className={styles.teamIcon} />
                    <span>空间成员（{spaceMembers.length}）</span>
                  </div>
                  <span className={styles.inheritLabel}>继承权限</span>
                </div>

                {/* 空间成员列表 */}
                {spaceMembersExpanded && (
                  <div className={styles.spaceMembersList}>
                    {spaceMembers.map((member) => (
                      <div key={member.id} className={styles.spaceMemberItem}>
                        <div className={styles.memberInfo}>
                          <Avatar
                            size={28}
                            className={styles.spaceMemberAvatar}
                            src={member.avatar}
                          >
                            {member.userName.charAt(0).toUpperCase()}
                          </Avatar>
                          <span className={styles.spaceMemberName}>
                            {member.userName}
                          </span>
                        </div>
                        <Select
                          value={member.role}
                          options={memberRoleOptions}
                          className={styles.memberRoleSelect}
                          size="small"
                          variant="borderless"
                          suffixIcon={<DownOutlined style={{ fontSize: 10 }} />}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加成员弹窗 */}
      <AddMemberModal
        open={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        onConfirm={handleAddMemberConfirm}
      />
    </>
  );
};

export default MemberManageDrawer;
