/**
 * 素材视图组件（研讨会 / 直播）
 * 配置项与 TUIRoomKit 参数一一映射：
 *   StartOptions:  roomName, password, isOpenCamera, isOpenMicrophone,
 *                  isMicrophoneDisableForAllUser, isCameraDisableForAllUser
 *   Schedule API:  scheduleStartTime（日期+时间）, scheduleDuration, scheduleAttendees
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Input, Select, Switch, Tooltip } from 'antd';
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
  CalendarOutlined,
  GlobalOutlined,
  UserOutlined,
  MutedOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { MaterialItem } from '../../types';
import styles from './index.module.less';

type MaterialTab = 'settings' | 'details';

interface MaterialViewProps {
  item: MaterialItem;
  onNameChange?: (id: string, newName: string) => void;
}

// 每 30 分钟一档的时间选项
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return { value: `${h}:${m}`, label: `${h}:${m}` };
});

const DURATION_OPTIONS = [
  { value: '1800',  label: '30 分钟' },
  { value: '3600',  label: '1 小时'  },
  { value: '5400',  label: '1.5 小时' },
  { value: '7200',  label: '2 小时'  },
  { value: '10800', label: '3 小时'  },
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC+08:00', label: 'UTC+08:00（北京）'   },
  { value: 'UTC+09:00', label: 'UTC+09:00（东京）'   },
  { value: 'UTC+00:00', label: 'UTC+00:00（伦敦）'   },
  { value: 'UTC-05:00', label: 'UTC-05:00（纽约）'   },
  { value: 'UTC-08:00', label: 'UTC-08:00（洛杉矶）' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MaterialView: React.FC<MaterialViewProps> = ({ item, onNameChange }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MaterialTab>('settings');
  const isSeminar = item.sourceType === 'seminar';
  const typeLabel = isSeminar ? '研讨会' : '直播';

  // ===== StartOptions 参数 =====
  /** StartOptions.roomName */
  const [roomName, setRoomName] = useState('');
  /** StartOptions.isOpenCamera */
  const [isOpenCamera, setIsOpenCamera] = useState(true);
  /** StartOptions.isOpenMicrophone */
  const [isOpenMicrophone, setIsOpenMicrophone] = useState(true);
  /** StartOptions.isMicrophoneDisableForAllUser — 全体静音 */
  const [isMicrophoneDisableForAllUser, setIsMicrophoneDisableForAllUser] = useState(false);
  /** StartOptions.isCameraDisableForAllUser — 全体静画 */
  const [isCameraDisableForAllUser, setIsCameraDisableForAllUser] = useState(false);

  // ===== 安全设置：password =====
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  /** StartOptions.password */
  const [password, setPassword] = useState('');

  // ===== Schedule API 参数（scheduleConference，当前仅 UI，未接入）=====
  /** scheduleStartTime — 日期 */
  const [startDate, setStartDate] = useState(todayStr);
  /** scheduleStartTime — 时间 */
  const [startTime, setStartTime] = useState('16:00');
  /** scheduleDuration（秒） */
  const [duration, setDuration] = useState('1800');
  /** 时区（影响 scheduleStartTime 时间戳计算） */
  const [timezone, setTimezone] = useState('UTC+08:00');
  /** scheduleAttendees（userId 逗号分隔） */
  const [attendees, setAttendees] = useState('');

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onNameChange?.(item.id, roomName.trim() || typeLabel);
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
      isMicrophoneDisableForAllUser: String(isMicrophoneDisableForAllUser),
      isCameraDisableForAllUser: String(isCameraDisableForAllUser),
    });
    if (passwordEnabled && password.trim()) params.set('password', password.trim());
    navigate(`/meeting?${params.toString()}`);
  };

  const renderSettings = () => (
    <div className={styles.settingsForm}>

      {/* roomName */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          房间名称 <span className={styles.required}>*</span>
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

      {/* scheduleStartTime */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          <CalendarOutlined style={{ marginRight: 4 }} />
          开始时间
        </label>
        <div className={styles.formControl}>
          <div className={styles.timeRow}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
            <Select
              value={startTime}
              onChange={setStartTime}
              options={TIME_OPTIONS}
              className={styles.timeSelect}
              popupMatchSelectWidth={false}
            />
          </div>
          <div className={styles.fieldHint}>对应 RTC 参数：<code>scheduleStartTime</code>（Unix 时间戳，Schedule API）</div>
        </div>
      </div>

      {/* scheduleDuration */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          会议时长
        </label>
        <div className={styles.formControl}>
          <Select
            value={duration}
            onChange={setDuration}
            options={DURATION_OPTIONS}
            className={styles.formSelect}
          />
          <div className={styles.fieldHint}>对应 RTC 参数：<code>scheduleDuration</code>（秒，Schedule API）</div>
        </div>
      </div>

      {/* timezone */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          <GlobalOutlined style={{ marginRight: 4 }} />
          时区
        </label>
        <div className={styles.formControl}>
          <Select
            value={timezone}
            onChange={setTimezone}
            options={TIMEZONE_OPTIONS}
            className={styles.formSelect}
          />
          <div className={styles.fieldHint}>影响 <code>scheduleStartTime</code> 时间戳计算（display only）</div>
        </div>
      </div>

      {/* scheduleAttendees */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          <UserOutlined style={{ marginRight: 4 }} />
          参会成员
        </label>
        <div className={styles.formControl}>
          <Input
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="请输入参会成员名称"
            className={styles.formInput}
            suffix={<TeamOutlined style={{ color: '#999' }} />}
          />
          <div className={styles.fieldHint}>对应 RTC 参数：<code>scheduleAttendees</code>（userId 列表，Schedule API）</div>
        </div>
      </div>

      <div className={styles.formDivider} />

      {/* 安全设置 → password */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          <LockOutlined style={{ marginRight: 4 }} />
          安全设置
        </label>
        <div className={styles.formControl}>
          <div className={styles.checkItem}>
            <Checkbox
              checked={passwordEnabled}
              onChange={(e) => {
                setPasswordEnabled(e.target.checked);
                if (!e.target.checked) setPassword('');
              }}
            >
              房间密码
            </Checkbox>
          </div>
          {passwordEnabled && (
            <div className={styles.subOptions}>
              <Input.Password
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.formInput}
                maxLength={20}
              />
              <div className={styles.fieldHint}>对应 RTC 参数：<code>password</code></div>
            </div>
          )}
        </div>
      </div>

      {/* 成员管理 → isMicrophoneDisableForAllUser / isCameraDisableForAllUser */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>成员管理</label>
        <div className={styles.formControl}>
          <div className={styles.checkItem}>
            <Checkbox
              checked={isMicrophoneDisableForAllUser}
              onChange={(e) => setIsMicrophoneDisableForAllUser(e.target.checked)}
            >
              全体静音
            </Checkbox>
            <span className={styles.fieldHint} style={{ display: 'inline', marginLeft: 8 }}>
              <code>isMicrophoneDisableForAllUser</code>
            </span>
          </div>
          <div className={styles.checkItem}>
            <Checkbox
              checked={isCameraDisableForAllUser}
              onChange={(e) => setIsCameraDisableForAllUser(e.target.checked)}
            >
              全体静画
            </Checkbox>
            <span className={styles.fieldHint} style={{ display: 'inline', marginLeft: 8 }}>
              <code>isCameraDisableForAllUser</code>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.formDivider} />

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

      <div className={styles.formActions}>
        <Button type="primary" className={styles.saveBtn} onClick={handleSave}>
          保存
        </Button>
        <Button className={styles.cancelBtn}>取消</Button>
      </div>
    </div>
  );

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
          <CalendarOutlined className={styles.detailIcon} />
          <span>{startDate} {startTime}（{TIMEZONE_OPTIONS.find(o => o.value === timezone)?.label}）</span>
        </div>
        <div className={styles.detailRow}>
          <ClockCircleOutlined className={styles.detailIcon} />
          <span>{DURATION_OPTIONS.find(o => o.value === duration)?.label}</span>
        </div>
        {attendees && (
          <div className={styles.detailRow}>
            <TeamOutlined className={styles.detailIcon} />
            <span>参会成员：{attendees}</span>
          </div>
        )}
        <div className={styles.detailRow}>
          <VideoCameraOutlined className={styles.detailIcon} />
          <span>摄像头：{isOpenCamera ? '默认开启' : '默认关闭'}</span>
        </div>
        <div className={styles.detailRow}>
          <AudioOutlined className={styles.detailIcon} />
          <span>麦克风：{isOpenMicrophone ? '默认开启' : '默认关闭'}</span>
        </div>
        {isMicrophoneDisableForAllUser && (
          <div className={styles.detailRow}>
            <MutedOutlined className={styles.detailIcon} />
            <span>全体静音</span>
          </div>
        )}
        {isCameraDisableForAllUser && (
          <div className={styles.detailRow}>
            <EyeInvisibleOutlined className={styles.detailIcon} />
            <span>全体静画</span>
          </div>
        )}
        {passwordEnabled && password && (
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

      <div className={styles.mainArea}>
        {activeTab === 'settings' ? renderSettings() : renderDetails()}
      </div>
    </div>
  );
};

export default MaterialView;
