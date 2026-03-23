/**
 * 素材视图组件（研讨会 / 直播）
 * 点击左侧素材条目后在右侧主区域显示
 * 结构与 MeetingView 一致：顶部导航 + 配置表单 / 详情视图
 */
import React, { useState } from 'react';
import { Button, Input, Radio, Checkbox, Select, Tag, Tooltip } from 'antd';
import {
  SettingOutlined,
  LoginOutlined,
  ProfileOutlined,
  PrinterOutlined,
  ExportOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { MaterialItem } from '../../types';
import styles from './index.module.less';

type MaterialTab = 'settings' | 'details';

interface MaterialViewProps {
  item: MaterialItem;
  onNameChange?: (id: string, newName: string) => void;
}

const MaterialView: React.FC<MaterialViewProps> = ({ item, onNameChange }) => {
  const [activeTab, setActiveTab] = useState<MaterialTab>('settings');
  const isSeminar = item.sourceType === 'seminar';
  const typeLabel = isSeminar ? '研讨会' : '直播';

  // ==================== 表单状态 ====================
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [password, setPassword] = useState('');
  const [allowReplay, setAllowReplay] = useState(false);
  const [autoRecord, setAutoRecord] = useState(false);
  const [needRegister, setNeedRegister] = useState(false);
  const [registerType, setRegisterType] = useState<'free' | 'paid'>('free');

  const handleSave = () => {
    const newName = title.trim() || typeLabel;
    onNameChange?.(item.id, newName);
  };

  /**
   * 配置表单
   */
  const renderSettings = () => (
    <div className={styles.settingsForm}>
      {/* 主题 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          {typeLabel}主题 <span className={styles.required}>*</span>
        </label>
        <div className={styles.formControl}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.formInput}
            placeholder={`请输入${typeLabel}主题`}
          />
        </div>
      </div>

      {/* 主办方 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>主办方</label>
        <div className={styles.formControl}>
          <Input
            placeholder="请输入主办方名称"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            className={styles.formInput}
          />
        </div>
      </div>

      {/* 时间 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          {isSeminar ? '研讨会时间' : '开播时间'} <span className={styles.required}>*</span>
        </label>
        <div className={styles.formControl}>
          <div className={styles.timeRow}>
            <Input defaultValue="2026/03/23" suffix={<CalendarOutlined />} className={styles.dateInput} readOnly />
            <Select defaultValue="09:00" className={styles.timeSelect}>
              <Select.Option value="09:00">09:00</Select.Option>
              <Select.Option value="09:30">09:30</Select.Option>
              <Select.Option value="10:00">10:00</Select.Option>
            </Select>
            {isSeminar && (
              <>
                <span className={styles.timeSeparator}>—</span>
                <Input defaultValue="2026/03/23" suffix={<CalendarOutlined />} className={styles.dateInput} readOnly />
                <Select defaultValue="10:00" className={styles.timeSelect}>
                  <Select.Option value="10:00">10:00</Select.Option>
                  <Select.Option value="10:30">10:30</Select.Option>
                  <Select.Option value="11:00">11:00</Select.Option>
                </Select>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.formDivider} />

      {/* 报名 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          报名{' '}
          <Tooltip title="观众报名后才能参加">
            <InfoCircleOutlined className={styles.infoIcon} />
          </Tooltip>
        </label>
        <div className={styles.formControl}>
          <Checkbox checked={needRegister} onChange={(e) => setNeedRegister(e.target.checked)}>
            观众需报名入会
          </Checkbox>
          <div className={styles.subOptions}>
            <Radio.Group value={registerType} onChange={(e) => setRegisterType(e.target.value)}>
              <Radio value="free">免费报名</Radio>
              <Radio value="paid">
                付费报名{' '}
                <Tag color="orange" className={styles.featureTag}>付费</Tag>
              </Radio>
            </Radio.Group>
          </div>
        </div>
      </div>

      {/* 观众人数上限 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>观众人数上限</label>
        <div className={styles.formControl}>
          <span className={styles.inlineValue}>100人</span>
          <Tag color="green" className={styles.featureTag}>试用</Tag>
        </div>
      </div>

      {/* 密码 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>密码</label>
        <div className={styles.formControl}>
          <Input
            placeholder="请输入4-6位数字密码(选填)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.formInput}
          />
        </div>
      </div>

      {/* 回放 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>回放</label>
        <div className={styles.formControl}>
          <div className={styles.checkItem}>
            <Checkbox checked={allowReplay} onChange={(e) => setAllowReplay(e.target.checked)}>
              允许观众观看录制回放
            </Checkbox>
            <Tag color="green" className={styles.featureTag}>试用</Tag>
          </div>
          <div className={styles.checkItem}>
            <Checkbox checked={autoRecord} onChange={(e) => setAutoRecord(e.target.checked)}>
              自动云录制
            </Checkbox>
          </div>
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
   * 详情视图（简版）
   */
  const renderDetails = () => (
    <div className={styles.detailsView}>
      <div className={styles.detailCard}>
        <h2 className={styles.detailTitle}>
          {isSeminar
            ? <TeamOutlined style={{ color: '#4A90D9', marginRight: 8 }} />
            : <PlayCircleOutlined style={{ color: '#F56C6C', marginRight: 8 }} />
          }
          {item.name === '未命名' ? `未命名${typeLabel}` : item.name}
        </h2>
        <div className={styles.detailRow}>
          <ClockCircleOutlined className={styles.detailIcon} />
          <span>暂未设置{isSeminar ? '研讨会' : '直播'}时间</span>
        </div>
        <div className={styles.detailRow}>
          <VideoCameraOutlined className={styles.detailIcon} />
          <span>暂无录制文件</span>
        </div>
        <p className={styles.detailEmpty}>
          请先在「{typeLabel}设置」中填写相关信息并保存。
        </p>
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
            {item.name === '未命名' ? `未命名${typeLabel}` : item.name}
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
