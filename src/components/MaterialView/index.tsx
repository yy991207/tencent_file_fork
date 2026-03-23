/**
 * 素材视图组件（研讨会 / 直播）
 * 配置项与 TUIRoomKit StartOptions 一一映射：
 *   roomName        → 直播/研讨会主题
 *   password        → 入会密码
 *   isOpenCamera    → 开启摄像头
 *   isOpenMicrophone → 开启麦克风
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Switch, Tag, Tooltip } from 'antd';
import {
  SettingOutlined,
  LoginOutlined,
  ProfileOutlined,
  PrinterOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  LockOutlined,
  AudioOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { MaterialItem } from '../../types';
import styles from './index.module.less';

type MaterialTab = 'settings' | 'details';

interface MaterialViewProps {
  item: MaterialItem;
  onNameChange?: (id: string, newName: string) => void;
}

const MaterialView: React.FC<MaterialViewProps> = ({ item, onNameChange }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MaterialTab>('settings');
  const isSeminar = item.sourceType === 'seminar';
  const typeLabel = isSeminar ? '研讨会' : '直播';

  // ==================== 表单状态（与 TUIRoomKit StartOptions 一一对应）====================
  /** StartOptions.roomName */
  const [roomName, setRoomName] = useState('');
  /** StartOptions.password */
  const [password, setPassword] = useState('');
  /** StartOptions.isOpenCamera */
  const [isOpenCamera, setIsOpenCamera] = useState(true);
  /** StartOptions.isOpenMicrophone */
  const [isOpenMicrophone, setIsOpenMicrophone] = useState(true);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const name = roomName.trim() || typeLabel;
    onNameChange?.(item.id, name);
    setSaved(true);
  };

  const handleStartLive = () => {
    const roomId = String(Math.floor(100000 + Math.random() * 900000));
    const params = new URLSearchParams({
      action: 'start',
      roomId,
      roomName: roomName.trim() || `${typeLabel} - ${item.name}`,
      isOpenCamera: String(isOpenCamera),
      isOpenMicrophone: String(isOpenMicrophone),
    });
    if (password.trim()) params.set('password', password.trim());
    navigate(`/meeting?${params.toString()}`);
  };

  /**
   * 配置表单 — 每项均映射至 StartOptions
   */
  const renderSettings = () => (
    <div className={styles.settingsForm}>
      {/* roomName */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          {typeLabel}主题 <span className={styles.required}>*</span>
        </label>
        <div className={styles.formControl}>
          <Input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className={styles.formInput}
            placeholder={`请输入${typeLabel}主题`}
          />
          <div className={styles.fieldHint}>对应 RTC 参数：<code>roomName</code></div>
        </div>
      </div>

      {/* password */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          <LockOutlined style={{ marginRight: 4 }} />
          入会密码
        </label>
        <div className={styles.formControl}>
          <Input
            placeholder="请输入密码（选填）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.formInput}
            maxLength={20}
          />
          <div className={styles.fieldHint}>对应 RTC 参数：<code>password</code></div>
        </div>
      </div>

      {/* isOpenCamera */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          开启摄像头
          <Tooltip title="进入会议时是否默认开启摄像头">
            <InfoCircleOutlined className={styles.infoIcon} />
          </Tooltip>
        </label>
        <div className={styles.formControl}>
          <Switch checked={isOpenCamera} onChange={setIsOpenCamera} />
          <div className={styles.fieldHint}>对应 RTC 参数：<code>isOpenCamera</code></div>
        </div>
      </div>

      {/* isOpenMicrophone */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          <AudioOutlined style={{ marginRight: 4 }} />
          开启麦克风
          <Tooltip title="进入会议时是否默认开启麦克风">
            <InfoCircleOutlined className={styles.infoIcon} />
          </Tooltip>
        </label>
        <div className={styles.formControl}>
          <Switch checked={isOpenMicrophone} onChange={setIsOpenMicrophone} />
          <div className={styles.fieldHint}>对应 RTC 参数：<code>isOpenMicrophone</code></div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className={styles.formActions}>
        <Button type="primary" className={styles.saveBtn} onClick={handleSave}>
          保存
        </Button>
        <Button className={styles.cancelBtn}>取消</Button>
      </div>
    </div>
  );

  /**
   * 详情视图
   */
  const renderDetails = () => (
    <div className={styles.detailsView}>
      <div className={styles.detailCard}>
        <h2 className={styles.detailTitle}>
          {isSeminar
            ? <TeamOutlined style={{ color: '#4A90D9', marginRight: 8 }} />
            : <PlayCircleOutlined style={{ color: '#F56C6C', marginRight: 8 }} />
          }
          {roomName || `未命名${typeLabel}`}
        </h2>
        <div className={styles.detailRow}>
          <ClockCircleOutlined className={styles.detailIcon} />
          <span>暂未开始</span>
        </div>
        <div className={styles.detailRow}>
          <VideoCameraOutlined className={styles.detailIcon} />
          <span>摄像头：{isOpenCamera ? '默认开启' : '默认关闭'}</span>
        </div>
        <div className={styles.detailRow}>
          <AudioOutlined className={styles.detailIcon} />
          <span>麦克风：{isOpenMicrophone ? '默认开启' : '默认关闭'}</span>
        </div>
        {password && (
          <div className={styles.detailRow}>
            <LockOutlined className={styles.detailIcon} />
            <span>已设置入会密码</span>
          </div>
        )}
        {!saved && (
          <p className={styles.detailEmpty}>请先在「{typeLabel}设置」中填写信息并保存。</p>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.materialView}>
      {/* ==================== 顶部导航栏 ==================== */}
      <div className={styles.topNav}>
        <div className={styles.navLeft}>
          {isSeminar
            ? <TeamOutlined style={{ color: '#4A90D9', fontSize: 16 }} />
            : <PlayCircleOutlined style={{ color: '#F56C6C', fontSize: 16 }} />
          }
          <span className={styles.viewTitle}>
            {roomName || `未命名${typeLabel}`}
          </span>
        </div>
        <div className={styles.navRight}>
          <Button
            className={`${styles.actionBtn} ${activeTab === 'settings' ? styles.actionBtnActive : ''}`}
            icon={<SettingOutlined />}
            type="link"
            onClick={() => setActiveTab('settings')}
          >
            {typeLabel}设置
          </Button>
          <Button
            className={styles.actionBtnPrimary}
            icon={isSeminar ? <LoginOutlined /> : <PlayCircleOutlined />}
            type="link"
            onClick={handleStartLive}
            disabled={!saved}
          >
            {isSeminar ? '点击进入' : '开始直播'}
          </Button>
          <Button
            className={`${styles.actionBtn} ${activeTab === 'details' ? styles.actionBtnActive : ''}`}
            icon={<ProfileOutlined />}
            type="link"
            onClick={() => setActiveTab('details')}
          >
            {typeLabel}详情
          </Button>
          <div className={styles.navDivider} />
          <PrinterOutlined className={styles.navIcon} />
          <ExportOutlined className={styles.navIcon} />
        </div>
      </div>

      {/* ==================== 主内容区域 ==================== */}
      <div className={styles.mainArea}>
        {activeTab === 'settings' ? renderSettings() : renderDetails()}
      </div>
    </div>
  );
};

export default MaterialView;
