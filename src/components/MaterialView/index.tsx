/**
 * 素材视图组件（研讨会 / 直播）
 * 配置项与 TUIRoomKit 参数一一映射：
 *   StartOptions:  roomName, password, isOpenCamera, isOpenMicrophone,
 *                  isMicrophoneDisableForAllUser, isCameraDisableForAllUser
 *   Schedule API:  scheduleStartTime（日期+时间）, scheduleDuration, scheduleAttendees
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Input, Select, Switch, Tag, Tooltip } from 'antd';
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
  NumberOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { MaterialItem } from '../../types';
import SelectPeopleModal from '../SelectPeople';
import styles from './index.module.less';

type MaterialTab = 'settings' | 'launch' | 'details';

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
  /** 已选人员对象列表（用于回显姓名） */
  const [selectedAttendeeObjects, setSelectedAttendeeObjects] = useState<{ id: string; name: string }[]>([]);
  /** 选人弹窗开关 */
  const [selectPeopleOpen, setSelectPeopleOpen] = useState(false);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onNameChange?.(item.id, roomName.trim() || typeLabel);
    setSaved(true);
  };

  const handleStartLive = () => {
    const roomId = String(Math.floor(100000 + Math.random() * 900000));
    // 研讨会 → Standard(1)普通会议；直播 → Webinar(2)网络研讨会
    const roomType = isSeminar ? 1 : 2;
    const params = new URLSearchParams({
      action: 'start',
      roomId,
      roomType: String(roomType),
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
        </div>
      </div>

      {/* scheduleAttendees */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          <UserOutlined style={{ marginRight: 4 }} />
          参会成员
        </label>
        <div className={styles.formControl}>
          <div className={styles.attendeesBox}>
            {selectedAttendeeObjects.map((u) => (
              <Tag
                key={u.id}
                closable
                onClose={() =>
                  setSelectedAttendeeObjects((prev) => prev.filter((p) => p.id !== u.id))
                }
                className={styles.attendeeTag}
              >
                {u.name}
              </Tag>
            ))}
            <TeamOutlined
              className={styles.attendeesAddBtn}
              onClick={() => setSelectPeopleOpen(true)}
            />
          </div>
        </div>
      </div>

      <SelectPeopleModal
        open={selectPeopleOpen}
        onCancel={() => setSelectPeopleOpen(false)}
        onConfirm={({ users, depts }) => {
          // 合并已有 + 新选，去重
          const merged = [...selectedAttendeeObjects];
          [...users, ...depts].forEach((p) => {
            if (!merged.find((m) => m.id === p.id)) merged.push(p);
          });
          setSelectedAttendeeObjects(merged);
          setAttendees(merged.map((p) => p.name).join('、'));
          setSelectPeopleOpen(false);
        }}
      />

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
          </div>
          <div className={styles.checkItem}>
            <Checkbox
              checked={isCameraDisableForAllUser}
              onChange={(e) => setIsCameraDisableForAllUser(e.target.checked)}
            >
              全体静画
            </Checkbox>
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

  const renderLaunch = () => {
    const durationLabel = DURATION_OPTIONS.find(o => o.value === duration)?.label ?? '';
    const tzLabel = TIMEZONE_OPTIONS.find(o => o.value === timezone)?.label ?? timezone;

    return (
      <div className={styles.launchView}>
        {/* ── 未保存提示 ── */}
        {!saved && (
          <div className={styles.launchNotice}>
            <InfoCircleOutlined style={{ marginRight: 6 }} />
            请先在「{typeLabel}设置」中填写信息并保存，再进入{typeLabel}。
            <Button type="link" size="small" onClick={() => setActiveTab('settings')} style={{ padding: '0 4px' }}>
              去设置
            </Button>
          </div>
        )}

        <div className={styles.launchCard}>
          {/* ── 标题区 ── */}
          <div className={styles.launchHeader}>
            <div className={styles.launchIconWrap}>
              {isSeminar
                ? <TeamOutlined style={{ fontSize: 28, color: '#4A90D9' }} />
                : <VideoCameraOutlined style={{ fontSize: 28, color: '#F56C6C' }} />
              }
            </div>
            <div className={styles.launchMeta}>
              <div className={styles.launchTitle}>{roomName || `未命名${typeLabel}`}</div>
              <span className={styles.launchBadge} data-type={isSeminar ? 'seminar' : 'live'}>
                {isSeminar ? '研讨会' : '直播'}
              </span>
            </div>
          </div>

          {/* ── 会议信息 ── */}
          <div className={styles.launchSection}>
            <div className={styles.launchSectionTitle}>会议信息</div>
            <div className={styles.launchInfoList}>
              <div className={styles.launchInfoRow}>
                <CalendarOutlined className={styles.launchInfoIcon} />
                <span className={styles.launchInfoLabel}>开始时间</span>
                <span className={styles.launchInfoValue}>{startDate} {startTime} <span className={styles.launchTz}>{tzLabel}</span></span>
              </div>
              <div className={styles.launchInfoRow}>
                <ClockCircleOutlined className={styles.launchInfoIcon} />
                <span className={styles.launchInfoLabel}>会议时长</span>
                <span className={styles.launchInfoValue}>{durationLabel}</span>
              </div>
              <div className={styles.launchInfoRow}>
                <TeamOutlined className={styles.launchInfoIcon} />
                <span className={styles.launchInfoLabel}>参会成员</span>
                <span className={styles.launchInfoValue}>
                  {selectedAttendeeObjects.length > 0
                    ? selectedAttendeeObjects.map(u => (
                        <Tag key={u.id} className={styles.launchAttendeTag}>{u.name}</Tag>
                      ))
                    : <span className={styles.launchEmpty}>暂未添加</span>
                  }
                </span>
              </div>
              <div className={styles.launchInfoRow}>
                <LockOutlined className={styles.launchInfoIcon} />
                <span className={styles.launchInfoLabel}>入会密码</span>
                <span className={styles.launchInfoValue}>
                  {passwordEnabled && password
                    ? <><span className={styles.dotOn} />已设置</>
                    : <><span className={styles.dotOff} />无需密码</>
                  }
                </span>
              </div>
            </div>
          </div>

          {/* ── 设备设置 ── */}
          <div className={styles.launchSection}>
            <div className={styles.launchSectionTitle}>设备设置</div>
            <div className={styles.launchDeviceGrid}>
              <div className={styles.launchDeviceItem}>
                <VideoCameraOutlined className={styles.launchDeviceIcon} />
                <span className={styles.launchDeviceName}>摄像头</span>
                <span className={isOpenCamera ? styles.statusOn : styles.statusOff}>
                  {isOpenCamera ? '入会开启' : '入会关闭'}
                </span>
              </div>
              <div className={styles.launchDeviceItem}>
                <AudioOutlined className={styles.launchDeviceIcon} />
                <span className={styles.launchDeviceName}>麦克风</span>
                <span className={isOpenMicrophone ? styles.statusOn : styles.statusOff}>
                  {isOpenMicrophone ? '入会开启' : '入会关闭'}
                </span>
              </div>
              <div className={styles.launchDeviceItem}>
                <MutedOutlined className={styles.launchDeviceIcon} />
                <span className={styles.launchDeviceName}>全体静音</span>
                <span className={isMicrophoneDisableForAllUser ? styles.statusWarn : styles.statusOff}>
                  {isMicrophoneDisableForAllUser ? '已开启' : '未开启'}
                </span>
              </div>
              <div className={styles.launchDeviceItem}>
                <EyeInvisibleOutlined className={styles.launchDeviceIcon} />
                <span className={styles.launchDeviceName}>全体静画</span>
                <span className={isCameraDisableForAllUser ? styles.statusWarn : styles.statusOff}>
                  {isCameraDisableForAllUser ? '已开启' : '未开启'}
                </span>
              </div>
            </div>
          </div>

          {/* ── 操作按钮 ── */}
          <div className={styles.launchActions}>
            <Button
              type="primary"
              size="large"
              className={styles.launchEnterBtn}
              icon={isSeminar ? <LoginOutlined /> : <PlayCircleOutlined />}
              onClick={handleStartLive}
              disabled={!saved}
            >
              点击进入
            </Button>
            <Button size="large" onClick={() => setActiveTab('settings')}>
              返回设置
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const AVATAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const getAvatarColor = (name: string) => {
      let h = 0;
      for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
      return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
    };
    const formatDate = (d: string) => {
      const [y, m, day] = d.split('-');
      return `${y}年${m}月${day}日`;
    };
    const dateObj = new Date(startDate);
    const weekday = WEEKDAYS[dateObj.getDay()];
    const displayDate = formatDate(startDate);
    const durationLabel = DURATION_OPTIONS.find(o => o.value === duration)?.label ?? '';
    // 用房间名生成伪 ID（演示用）
    const fakeId = [3, 3, 3].map((_, i) =>
      String(Math.abs(roomName.split('').reduce((a, c) => a + c.charCodeAt(0), i * 137)) % 1000).padStart(3, '0')
    ).join(' ');

    if (!saved) {
      return (
        <div className={styles.detailsView}>
          <div className={styles.detailEmpty}>请先在「{typeLabel}设置」中填写信息并保存。</div>
        </div>
      );
    }

    return (
      <div className={styles.detailsView}>

        {/* ── 信息卡 ── */}
        <div className={styles.detailInfoCard}>
          <div className={styles.detailMeetingTitle}>
            {roomName || `未命名${typeLabel}`}
            <span className={styles.detailTypeBadge} data-type={isSeminar ? 'seminar' : 'live'}>
              {isSeminar ? '研讨会' : '直播'}
            </span>
          </div>

          <div className={styles.detailMetaRow}>
            <ClockCircleOutlined className={styles.detailMetaIcon} />
            <span>{displayDate}（{weekday}）{startTime}
              {durationLabel && <span className={styles.detailMetaSep}>|</span>}
              {durationLabel}
            </span>
          </div>

          <div className={styles.detailMetaRow}>
            <NumberOutlined className={styles.detailMetaIcon} />
            <span>会议 ID：{fakeId}</span>
          </div>

          {selectedAttendeeObjects.length > 0 && (
            <div className={styles.detailMetaRow}>
              <UserOutlined className={styles.detailMetaIcon} />
              <div className={styles.detailAvatarList}>
                {selectedAttendeeObjects.slice(0, 5).map(u => (
                  <div
                    key={u.id}
                    className={styles.detailAvatar}
                    style={{ background: getAvatarColor(u.name) }}
                    title={u.name}
                  >
                    {u.name.slice(0, 1)}
                  </div>
                ))}
                {selectedAttendeeObjects.length > 5 && (
                  <div className={styles.detailAvatarMore}>+{selectedAttendeeObjects.length - 5}</div>
                )}
              </div>
            </div>
          )}

          <div className={styles.detailMetaRow}>
            <CalendarOutlined className={styles.detailMetaIcon} />
            <a className={styles.detailCalLink}>在日历中查看详情</a>
          </div>
        </div>

        {/* ── 会议纪要 ── */}
        <div className={styles.detailSectionTitle}>会议纪要</div>
        <div className={styles.detailFileCard}>
          <div className={styles.detailFileIconWrap} data-color="blue">
            <FileTextOutlined />
          </div>
          <div className={styles.detailFileInfo}>
            <div className={styles.detailFileName}>智能纪要：{roomName || typeLabel}</div>
            <div className={styles.detailFileOwner}>所有者：我</div>
          </div>
        </div>

        {/* ── 录制文件 ── */}
        <div className={styles.detailSectionTitle}>录制文件（妙记）</div>
        <div className={styles.detailFileCard}>
          <div className={styles.detailRecordThumb}>
            <VideoCameraOutlined />
          </div>
          <div className={styles.detailFileInfo}>
            <div className={styles.detailFileName}>{roomName || typeLabel}</div>
            <div className={styles.detailFileOwner}>所有者：我</div>
          </div>
        </div>

        {/* ── 活动时间线 ── */}
        <div className={styles.detailTimelineDate}>{displayDate}</div>
        <div className={styles.detailTimeline}>
          <div className={styles.detailTimelineItem}>
            <span className={styles.detailTimelineTime}>{startTime}</span>
            <span>创建{typeLabel}</span>
          </div>
          <div className={styles.detailTimelineItem}>
            <span className={styles.detailTimelineTime}>{startTime}</span>
            <span>来自 <a className={styles.detailCalLink}>我</a> 的会中呼叫</span>
          </div>
        </div>

      </div>
    );
  };

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
            className={`${styles.actionBtnPrimary} ${activeTab === 'launch' ? styles.actionBtnActive : ''}`}
            icon={isSeminar ? <LoginOutlined /> : <PlayCircleOutlined />}
            type="link"
            onClick={() => setActiveTab('launch')}
          >
            点击进入
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
        {activeTab === 'settings' ? renderSettings() : activeTab === 'launch' ? renderLaunch() : renderDetails()}
      </div>
    </div>
  );
};

export default MaterialView;
