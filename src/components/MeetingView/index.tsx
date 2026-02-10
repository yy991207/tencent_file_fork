/**
 * 会议视图组件
 * 点击会议记录后在右侧显示
 * 包含会议设置（默认）、点击入会、会议详情三个操作按钮
 * 会议设置 → 完整的会议配置表单
 * 会议详情 → 会议详情视图（时间、纪要、录制、时间线）
 */
import React, { useState } from 'react';
import { Button, Input, Radio, Checkbox, Select, Tag, Avatar, Tooltip, Popover } from 'antd';
import {
  SettingOutlined,
  LoginOutlined,
  ProfileOutlined,
  PrinterOutlined,
  ExportOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  UserOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';

type MeetingTab = 'settings' | 'details';

/** 参会人员数据 */
const participantList = [
  { name: '曹鹏', color: '#333', tags: ['发起人', '外部'] },
  { name: '张洪磊', color: '#8B6914', tags: [] },
  { name: '单楠', color: '#D4A017', tags: [] },
  { name: '李弥防', color: '#6B8E23', tags: [] },
  { name: '逢博', color: '#CD5C5C', tags: [] },
  { name: '王雷', color: '#4682B4', tags: [] },
  { name: '杨明涛', color: '#2E8B57', tags: ['外部'] },
  { name: '袁伟', color: '#7B68EE', tags: [] },
  { name: '周丽', color: '#708090', tags: [] },
];

interface MeetingViewProps {
  meetingName?: string;
  onBack?: () => void;
  onNameChange?: (newName: string) => void;
}

const MeetingView: React.FC<MeetingViewProps> = ({
  meetingName = '项目周会',
  onBack: _onBack,
  onNameChange,
}) => {
  const [activeTab, setActiveTab] = useState<MeetingTab>('settings');

  // ==================== 会议设置表单状态 ====================
  const [topic, setTopic] = useState('张洪磊预定的网络研讨会');
  const [organizer, setOrganizer] = useState('');
  const [timezone] = useState('(GMT+08:00) 中国标准时间 – 北京');
  const [isRecurring, setIsRecurring] = useState(false);
  const [needRegister, setNeedRegister] = useState(false);
  const [registerType, setRegisterType] = useState<'free' | 'paid'>('free');
  const [password, setPassword] = useState('');
  const [allowReplay, setAllowReplay] = useState(false);
  const [autoCloudRecord, setAutoCloudRecord] = useState(false);
  const [prepareMode, setPrepareMode] = useState(false);
  const [guestEarlyJoin, setGuestEarlyJoin] = useState(false);
  const [enableQA, setEnableQA] = useState(true);
  const [textWatermark, setTextWatermark] = useState(false);
  const [audioWatermark, setAudioWatermark] = useState(false);
  const [disableScreenshot, setDisableScreenshot] = useState(false);
  const [showAttendeeCount, setShowAttendeeCount] = useState(true);
  const [guestMuteOnJoin, setGuestMuteOnJoin] = useState<string>('auto6');
  const [autoTranscribe, setAutoTranscribe] = useState(false);

  /**
   * 渲染会议设置表单（对应截图1）
   */
  const renderSettingsForm = () => (
    <div className={styles.settingsForm}>
      {/* 会议主题 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          会议主题 <span className={styles.required}>*</span>
        </label>
        <div className={styles.formControl}>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} className={styles.formInput} />
        </div>
      </div>

      {/* 主办方 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>主办方</label>
        <div className={styles.formControl}>
          <Input placeholder="请输入主办方名称" value={organizer} onChange={(e) => setOrganizer(e.target.value)} className={styles.formInput} />
        </div>
      </div>

      {/* 会议时间 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          会议时间 <span className={styles.required}>*</span>
        </label>
        <div className={styles.formControl}>
          <div className={styles.timeRow}>
            <Input defaultValue="2026/02/10" suffix={<CalendarOutlined />} className={styles.dateInput} readOnly />
            <Select defaultValue="09:00" className={styles.timeSelect}>
              <Select.Option value="09:00">09:00</Select.Option>
              <Select.Option value="09:30">09:30</Select.Option>
              <Select.Option value="10:00">10:00</Select.Option>
            </Select>
            <span className={styles.timeSeparator}>—</span>
            <Input defaultValue="2026/02/10" suffix={<CalendarOutlined />} className={styles.dateInput} readOnly />
            <Select defaultValue="10:00" className={styles.timeSelect}>
              <Select.Option value="09:30">09:30</Select.Option>
              <Select.Option value="10:00">10:00</Select.Option>
              <Select.Option value="10:30">10:30</Select.Option>
            </Select>
          </div>
          <div className={styles.timeHint}>
            最多支持10名嘉宾和100名观众参会，限时40分钟。<a className={styles.upgradeLink}>升级能力 &gt;</a>
          </div>
        </div>
      </div>

      {/* 时区 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          时区 <span className={styles.required}>*</span>
        </label>
        <div className={styles.formControl}>
          <Select value={timezone} className={styles.formSelect} style={{ width: '100%' }}>
            <Select.Option value={timezone}>{timezone}</Select.Option>
          </Select>
          <div className={styles.checkItem} style={{ marginTop: 12 }}>
            <Checkbox checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)}>
              周期性会议
            </Checkbox>
            <Tag color="orange" className={styles.featureTag}>NEW</Tag>
          </div>
        </div>
      </div>

      <div className={styles.formDivider} />

      {/* 报名 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          报名 <Tooltip title="观众报名后才能参会"><InfoCircleOutlined className={styles.infoIcon} /></Tooltip>
        </label>
        <div className={styles.formControl}>
          <Checkbox checked={needRegister} onChange={(e) => setNeedRegister(e.target.checked)}>
            观众需报名入会
          </Checkbox>
          <div className={styles.subOptions}>
            <Radio.Group value={registerType} onChange={(e) => setRegisterType(e.target.value)}>
              <Radio value="free">免费报名</Radio>
              <Radio value="paid">
                付费报名 <Tooltip title="付费报名"><InfoCircleOutlined className={styles.infoIcon} /></Tooltip>
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
          <Input placeholder="请输入4-6位数字密码(选填)" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.formInput} />
        </div>
      </div>

      {/* 回放 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          回放 <Tooltip title="回放说明"><InfoCircleOutlined className={styles.infoIcon} /></Tooltip>
        </label>
        <div className={styles.formControl}>
          <div className={styles.checkItem}>
            <Checkbox checked={allowReplay} onChange={(e) => setAllowReplay(e.target.checked)}>
              允许观众观看录制回放
            </Checkbox>
            <Tag color="green" className={styles.featureTag}>试用</Tag>
          </div>
          <div className={styles.checkItem}>
            <Checkbox checked={autoCloudRecord} onChange={(e) => setAutoCloudRecord(e.target.checked)}>
              自动云录制
            </Checkbox>
          </div>
        </div>
      </div>

      {/* 设置 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>设置</label>
        <div className={styles.formControl}>
          <div className={styles.checkItem}>
            <Checkbox checked={prepareMode} onChange={(e) => setPrepareMode(e.target.checked)}>
              会议准备模式
            </Checkbox>
            <Tag color="green" className={styles.featureTag}>试用</Tag>
          </div>
          <div className={styles.checkItem}>
            <Checkbox checked={guestEarlyJoin} onChange={(e) => setGuestEarlyJoin(e.target.checked)}>
              嘉宾可在主持人之前入会
            </Checkbox>
          </div>
          <div className={styles.checkItem}>
            <Checkbox checked={enableQA} onChange={(e) => setEnableQA(e.target.checked)}>
              会中开启问答功能
            </Checkbox>
            <Tooltip title="开启后参会者可提问"><InfoCircleOutlined className={styles.infoIcon} /></Tooltip>
          </div>
          <div className={styles.checkItem}>
            <Checkbox checked={textWatermark} onChange={(e) => setTextWatermark(e.target.checked)}>
              开启文字水印
            </Checkbox>
          </div>
          <div className={styles.checkItem}>
            <Checkbox checked={audioWatermark} onChange={(e) => setAudioWatermark(e.target.checked)}>
              开启音频水印 <ArrowUpOutlined className={styles.upgradeArrow} />
            </Checkbox>
          </div>
          <p className={styles.settingHint}>当成员在腾讯会议客户端参加会议时，将水印嵌入会议音频中。</p>
          <div className={styles.checkItem}>
            <Checkbox checked={disableScreenshot} onChange={(e) => setDisableScreenshot(e.target.checked)}>
              禁用笔记截屏
            </Checkbox>
            <Tooltip title="禁用说明"><InfoCircleOutlined className={styles.infoIcon} /></Tooltip>
          </div>
          <div className={styles.checkItem}>
            <Checkbox checked={showAttendeeCount} onChange={(e) => setShowAttendeeCount(e.target.checked)}>
              允许观众查看会中人数
            </Checkbox>
            <Tooltip title="人数说明"><InfoCircleOutlined className={styles.infoIcon} /></Tooltip>
          </div>

          {/* 嘉宾入会时静音 */}
          <div className={styles.muteSection}>
            <span className={styles.muteLabel}>嘉宾入会时静音</span>
            <Radio.Group value={guestMuteOnJoin} onChange={(e) => setGuestMuteOnJoin(e.target.value)}>
              <Radio value="on">开启</Radio>
              <Radio value="off">关闭</Radio>
              <Radio value="auto6">超过6人后自动开启</Radio>
            </Radio.Group>
          </div>

          <div className={styles.checkItem}>
            <Checkbox checked={autoTranscribe} onChange={(e) => setAutoTranscribe(e.target.checked)}>
              自动开启文字转写
            </Checkbox>
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className={styles.formActions}>
        <Button type="primary" className={styles.saveBtn} onClick={() => { if (topic.trim()) onNameChange?.(topic.trim()); }}>保存</Button>
        <Button className={styles.cancelBtn}>取消</Button>
      </div>
    </div>
  );

  /**
   * 渲染会议详情（对应截图2）
   */
  const renderDetails = () => (
    <div className={styles.detailsView}>
      {/* 会议标题卡片 */}
      <div className={styles.detailCard}>
        <h2 className={styles.detailTitle}>
          {meetingName}
          <Tag color="blue" className={styles.externalTag}>外部</Tag>
        </h2>

        <div className={styles.detailRow}>
          <ClockCircleOutlined className={styles.detailIcon} />
          <span>2025年12月23日（周二）17:58 - 19:14 | 1 小时 16 分 47 秒</span>
        </div>

        <div className={styles.detailRow}>
          <InfoCircleOutlined className={styles.detailIcon} />
          <span>会议 ID：465 134 548</span>
        </div>

        <Popover
          placement="bottomLeft"
          trigger="hover"
          overlayClassName={styles.participantPopover}
          content={
            <div className={styles.participantList}>
              {participantList.map((p) => (
                <div className={styles.participantItem} key={p.name}>
                  <Avatar size={36} style={{ backgroundColor: p.color, flexShrink: 0 }}>
                    {p.name.slice(0, 1)}
                  </Avatar>
                  <span className={styles.participantName}>{p.name}</span>
                  {p.tags.map((tag) => (
                    <Tag key={tag} color="blue" className={styles.participantTag}>{tag}</Tag>
                  ))}
                </div>
              ))}
            </div>
          }
        >
          <div className={styles.detailRow} style={{ cursor: 'pointer' }}>
            <TeamOutlined className={styles.detailIcon} />
            <Avatar.Group maxCount={5} size="small">
              {participantList.map((p) => (
                <Avatar key={p.name} style={{ backgroundColor: p.color }} size="small">
                  {p.name.slice(0, 1)}
                </Avatar>
              ))}
            </Avatar.Group>
          </div>
        </Popover>

        <div className={styles.calendarLink}>
          <CalendarOutlined className={styles.calendarIcon} />
          <a>在日历中查看详情</a>
        </div>
      </div>

      {/* 会议纪要 */}
      <div className={styles.detailSection}>
        <h3 className={styles.sectionTitle}>会议纪要</h3>
        <div className={styles.minutesCard}>
          <div className={styles.minutesIcon}>
            <FileTextOutlined />
          </div>
          <div className={styles.minutesInfo}>
            <span className={styles.minutesTitle}>智能纪要：{meetingName.length > 14 ? meetingName.slice(0, 14) + '...' : meetingName}</span>
            <span className={styles.minutesOwner}>所有者：曹鹏</span>
          </div>
        </div>
      </div>

      {/* 录制文件 */}
      <div className={styles.detailSection}>
        <h3 className={styles.sectionTitle}>录制文件（妙记）</h3>
        <div className={styles.recordingCard}>
          <div className={styles.recordingThumbnail}>
            <VideoCameraOutlined className={styles.recordingPlayIcon} />
          </div>
          <div className={styles.recordingInfo}>
            <span className={styles.recordingTitle}>{meetingName.length > 14 ? meetingName.slice(0, 14) + '...' : meetingName}</span>
            <span className={styles.recordingOwner}>所有者：曹鹏</span>
          </div>
        </div>
      </div>

      {/* 时间线 */}
      <div className={styles.detailSection}>
        <h3 className={styles.sectionTitleDate}>2025年12月23日</h3>
        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <span className={styles.timelineTime}>19:13</span>
            <span>离开会议</span>
          </div>
          <div className={styles.timelineItem}>
            <span className={styles.timelineTime}>17:58</span>
            <span>加入会议</span>
          </div>
          <div className={styles.timelineItem}>
            <span className={styles.timelineTime}>17:58</span>
            <span>来自 <a className={styles.personLink}>曹鹏</a> 的会中呼叫</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.meetingView}>
      {/* ==================== 顶部导航栏 ==================== */}
      <div className={styles.topNav}>
        <div className={styles.navLeft}>
          <span className={styles.meetingTitle}>{meetingName}</span>
        </div>
        <div className={styles.navRight}>
          <Button
            className={`${styles.actionBtn} ${activeTab === 'settings' ? styles.actionBtnActive : ''}`}
            icon={<SettingOutlined />}
            type="link"
            onClick={() => setActiveTab('settings')}
          >
            会议设置
          </Button>
          <Button
            className={styles.actionBtnPrimary}
            icon={<LoginOutlined />}
            type="link"
          >
            点击入会
          </Button>
          <Button
            className={`${styles.actionBtn} ${activeTab === 'details' ? styles.actionBtnActive : ''}`}
            icon={<ProfileOutlined />}
            type="link"
            onClick={() => setActiveTab('details')}
          >
            会议详情
          </Button>

          <div className={styles.navDivider} />
          <PrinterOutlined className={styles.navIcon} />
          <ExportOutlined className={styles.navIcon} />
        </div>
      </div>

      {/* ==================== 主内容区域 ==================== */}
      <div className={styles.mainArea}>
        {activeTab === 'settings' ? renderSettingsForm() : renderDetails()}
      </div>
    </div>
  );
};

export default MeetingView;
