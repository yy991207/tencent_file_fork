/**
 * 成员管理抽屉组件
 * 用于管理文件夹成员和权限设置
 * 从左侧面板右边界滑入（自定义实现，不使用 Ant Design Drawer）
 */
import React from 'react';
import { Button, Select, Avatar, Tooltip } from 'antd';
import {
  CloseOutlined,
  UserAddOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import { PermissionType } from '../../types';
import styles from './index.module.less';

/**
 * 权限选项配置
 */
const permissionOptions = [
  { value: 'private', label: '仅我可查看' },
  { value: 'viewable', label: '获得链接的人可查看' },
  { value: 'editable', label: '获得链接的人可编辑' },
];

const MemberManageDrawer: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    folderMembers,
    folderPermission,
    setFolderPermission,
    currentUser,
  } = useAppStore();

  // 判断抽屉是否打开
  const isOpen = activeModal === 'memberManage';

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
   * 添加成员
   */
  const handleAddMember = () => {
    console.log('添加成员');
  };

  /**
   * 邀请成员加入
   */
  const handleInviteMember = () => {
    console.log('邀请成员加入');
  };

  /**
   * 获取角色显示文本
   */
  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      owner: '文件夹所有者',
      editor: '可编辑',
      viewer: '可查看',
    };
    return roleMap[role] || role;
  };

  return (
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
              suffixIcon={null}
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
          {folderMembers.map((member) => (
            <div key={member.id} className={styles.memberItem}>
              <div className={styles.memberInfo}>
                {/* 成员头像 */}
                <Avatar
                  size={32}
                  className={styles.memberAvatar}
                  src={member.avatar}
                >
                  {member.userName.charAt(0).toUpperCase()}
                </Avatar>
                {/* 成员名称 */}
                <span className={styles.memberName}>
                  {member.userName}
                  {member.userId === currentUser?.id && ' (我)'}
                </span>
              </div>
              {/* 成员角色 */}
              <span className={styles.memberRole}>{getRoleText(member.role)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemberManageDrawer;
