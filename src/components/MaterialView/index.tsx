/**
 * 素材视图组件（研讨会）
 * 当前页面只保留已经确认能落到腾讯预约会议里的配置项，
 * 避免把还未接入真实链路的表单项继续展示给用户。
 */
// 由 vite.config.ts 从 config.yaml 注入，会议邀请链接基础地址
declare const __MEETING_BASE_URL__: string;

import React, { useState, useEffect } from 'react';
import { Button, Checkbox, Input, message, Select, Tag } from 'antd';
import {
  SettingOutlined,
  LoginOutlined,
  ProfileOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  MutedOutlined,
  EyeInvisibleOutlined,
  NumberOutlined,
  FileTextOutlined,
  CopyOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { MaterialItem, MaterialRoomConfig } from '../../types';
import { useAppStore } from '../../store';
import { getTencentScheduledRoomConfig, scheduleTencentMeeting } from '../../utils/tencentMeetingBridge';
import SelectPeopleModal from '../SelectPeople';
import { launchDesktopMeeting } from '@/utils/desktopLauncher';
import styles from './index.module.less';

type MaterialTab = 'settings' | 'launch' | 'details';

interface MaterialViewProps {
  item: MaterialItem;
  onNameChange?: (id: string, newName: string) => void;
}

const START_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0'),
}));

const START_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0'),
}));

const DURATION_HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => ({
  value: i,
  label: String(i),
}));

const DURATION_MINUTE_OPTIONS = [
  { value: 0, label: '00' },
  { value: 15, label: '15' },
  { value: 30, label: '30' },
  { value: 45, label: '45' },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTimeStr(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDurationLabel(durationValue: string) {
  const totalMinutes = Math.max(15, Math.floor((parseInt(durationValue, 10) || 1800) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} 分钟`;
  if (minutes === 0) return `${hours} 小时`;
  return `${hours} 小时 ${minutes} 分钟`;
}

const MaterialView: React.FC<MaterialViewProps> = ({ item, onNameChange }) => {
  const currentUser = useAppStore((s) => s.currentUser);
  const updateMaterialItemConfig = useAppStore((s) => s.updateMaterialItemConfig);
  const [activeTab, setActiveTab] = useState<MaterialTab>('settings');
  const typeLabel = '研讨会';

  // ===== StartOptions 参数 =====
  const [roomName, setRoomName] = useState('');
  const [isOpenCamera, setIsOpenCamera] = useState(true);
  const [isOpenMicrophone, setIsOpenMicrophone] = useState(true);
  const [isMicrophoneDisableForAllUser, setIsMicrophoneDisableForAllUser] = useState(false);
  const [isCameraDisableForAllUser, setIsCameraDisableForAllUser] = useState(false);

  // ===== Schedule API 参数 =====
  const [startDate, setStartDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('16:00');
  const [duration, setDuration] = useState('1800');
  const [timezone, setTimezone] = useState('UTC+08:00');
  const [selectedAttendeeObjects, setSelectedAttendeeObjects] = useState<{ id: string; name: string }[]>([]);
  const [selectPeopleOpen, setSelectPeopleOpen] = useState(false);

  const [saved, setSaved] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [savingToTencent, setSavingToTencent] = useState(false);
  const [syncingTencentConfig, setSyncingTencentConfig] = useState(false);
  const [tencentConfirmed, setTencentConfirmed] = useState(false);
  const shouldLockMemberManageConfig = Boolean(roomId);
  const [startHour = '16', startMinute = '00'] = startTime.split(':');
  const durationTotalMinutes = Math.max(15, Math.floor((parseInt(duration, 10) || 1800) / 60));
  const durationHours = Math.floor(durationTotalMinutes / 60);
  const durationMinutes = durationTotalMinutes % 60;
  const durationMinuteOptions = DURATION_MINUTE_OPTIONS.map((option) => ({
    ...option,
    disabled: (durationHours === 0 && option.value === 0) || (durationHours === 24 && option.value !== 0),
  }));

  const updateDurationValue = (nextHours: number, nextMinutes: number) => {
    const normalizedMinutes = nextHours === 24 ? 0 : nextMinutes;
    const totalMinutes = (nextHours * 60) + normalizedMinutes;
    const safeTotalMinutes = Math.min(24 * 60, Math.max(15, totalMinutes));
    setDuration(String(safeTotalMinutes * 60));
  };

  const handleDurationHourChange = (nextHours: number) => {
    const nextMinutes = nextHours === 24
      ? 0
      : (nextHours === 0 && durationMinutes === 0 ? 15 : durationMinutes);
    updateDurationValue(nextHours, nextMinutes);
  };

  const handleDurationMinuteChange = (nextMinutes: number) => {
    updateDurationValue(durationHours, nextMinutes);
  };

  const updateStartTimeValue = (nextHour: string, nextMinute: string) => {
    setStartTime(`${nextHour}:${nextMinute}`);
  };

  const resetFormState = () => {
    setRoomName('');
    setIsOpenCamera(true);
    setIsOpenMicrophone(true);
    setIsMicrophoneDisableForAllUser(false);
    setIsCameraDisableForAllUser(false);
    setStartDate(todayStr());
    setStartTime('16:00');
    setDuration('1800');
    setTimezone('UTC+08:00');
    setSelectedAttendeeObjects([]);
    setSaved(false);
    setRoomId('');
    setTencentConfirmed(false);
  };

  const applyRoomConfig = (cfg?: MaterialRoomConfig) => {
    resetFormState();
    if (!cfg) return;

    if (cfg.roomId) {
      setRoomId(cfg.roomId);
      setSaved(true);
    }
    if (cfg.roomName !== undefined) setRoomName(cfg.roomName);
    if (cfg.startDate) setStartDate(cfg.startDate);
    if (cfg.startTime) setStartTime(cfg.startTime);
    if (cfg.duration) setDuration(cfg.duration);
    if (cfg.timezone) setTimezone(cfg.timezone);
    if (cfg.attendees) setSelectedAttendeeObjects(cfg.attendees);
    if (cfg.isOpenCamera !== undefined) setIsOpenCamera(cfg.isOpenCamera);
    if (cfg.isOpenMicrophone !== undefined) setIsOpenMicrophone(cfg.isOpenMicrophone);
    if (cfg.isMicrophoneDisableForAllUser !== undefined) setIsMicrophoneDisableForAllUser(cfg.isMicrophoneDisableForAllUser);
    if (cfg.isCameraDisableForAllUser !== undefined) setIsCameraDisableForAllUser(cfg.isCameraDisableForAllUser);
  };

  const buildScheduleInfo = () => {
    // Tencent scheduleRoom 要的是“秒级时间戳”，这里不能直接传 Date.getTime() 的毫秒值。
    const scheduleStartTimestamp = Math.floor(new Date(`${startDate}T${startTime}:00`).getTime() / 1000);
    const scheduleEndTimestamp = scheduleStartTimestamp + parseInt(duration, 10);

    return {
      scheduleStartTimestamp,
      scheduleEndTimestamp,
      attendeeIds: selectedAttendeeObjects.map((user) => user.id),
    };
  };

  const buildLocalRoomConfig = (rid: string): MaterialRoomConfig => ({
    roomId: rid,
    roomName: roomName.trim(),
    startDate,
    startTime,
    duration,
    timezone,
    attendees: selectedAttendeeObjects,
    isOpenCamera,
    isOpenMicrophone,
    isMicrophoneDisableForAllUser,
    isCameraDisableForAllUser,
  });

  const buildRoomConfigFromTencent = (
    existingConfig: MaterialRoomConfig | undefined,
    payload: Awaited<ReturnType<typeof getTencentScheduledRoomConfig>>,
  ): MaterialRoomConfig => {
    const attendeeNameMap = new Map(
      (existingConfig?.attendees ?? []).map((attendee) => [attendee.id, attendee.name]),
    );

    const startDateTime = payload.scheduleStartTime ? new Date(payload.scheduleStartTime * 1000) : null;
    const durationSeconds = payload.scheduleStartTime && payload.scheduleEndTime
      ? Math.max(0, payload.scheduleEndTime - payload.scheduleStartTime)
      : null;

    return {
      roomId: payload.roomId,
      roomName: payload.roomName ?? existingConfig?.roomName ?? '',
      startDate: startDateTime ? formatDateStr(startDateTime) : existingConfig?.startDate ?? todayStr(),
      startTime: startDateTime ? formatTimeStr(startDateTime) : existingConfig?.startTime ?? '16:00',
      duration: durationSeconds !== null ? String(durationSeconds) : existingConfig?.duration ?? '1800',
      timezone: existingConfig?.timezone ?? 'UTC+08:00',
      attendees: (payload.scheduleAttendees ?? existingConfig?.attendees?.map((attendee) => attendee.id) ?? []).map((attendeeId) => ({
        id: attendeeId,
        name: attendeeNameMap.get(attendeeId) ?? attendeeId,
      })),
      isOpenCamera: existingConfig?.isOpenCamera ?? true,
      isOpenMicrophone: existingConfig?.isOpenMicrophone ?? true,
      isMicrophoneDisableForAllUser: payload.isAllMicrophoneDisabled ?? existingConfig?.isMicrophoneDisableForAllUser ?? false,
      isCameraDisableForAllUser: payload.isAllCameraDisabled ?? existingConfig?.isCameraDisableForAllUser ?? false,
    };
  };

  // ===== 从 Zustand 还原已保存的配置 =====
  useEffect(() => {
    applyRoomConfig(item.roomConfig);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.roomConfig]);

  useEffect(() => {
    const rid = item.roomConfig?.roomId;
    if (!rid || !currentUser?.id) return;

    let cancelled = false;

    const syncFromTencent = async () => {
      setSyncingTencentConfig(true);
      try {
        const payload = await getTencentScheduledRoomConfig({
          userId: currentUser.id,
          roomId: rid,
        });

        if (cancelled || !payload.found) return;

        const syncedConfig = buildRoomConfigFromTencent(item.roomConfig, payload);
        updateMaterialItemConfig(item.id, syncedConfig);
        setTencentConfirmed(true);
      } catch (error) {
        if (!cancelled) {
          console.warn('[MaterialView] getScheduledRoomConfig failed:', error);
        }
      } finally {
        if (!cancelled) {
          setSyncingTencentConfig(false);
        }
      }
    };

    void syncFromTencent();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  /** 生成指定成员的专属邀请链接 */
  const getInviteLink = (memberId: string) => {
    const base = __MEETING_BASE_URL__ || window.location.origin;
    return `${base}/meeting-app/#/room?roomId=${roomId}&roomType=1&userId=${memberId}`;
  };

  const handleSave = async () => {
    // 首次保存时生成房间 ID，后续保存保持不变
    const rid = roomId || String(Math.floor(100000 + Math.random() * 900000));
    if (!roomId) setRoomId(rid);

    // 先把本地配置写进 Zustand，避免用户切换 item 时丢表单内容。
    const localConfig = buildLocalRoomConfig(rid);
    updateMaterialItemConfig(item.id, localConfig);

    onNameChange?.(item.id, roomName.trim() || typeLabel);
    setSaved(true);

    if (!currentUser?.id) {
      message.warning('本地配置已保存，但当前没有可用的 Tencent 登录用户');
      return;
    }

    const { scheduleStartTimestamp, scheduleEndTimestamp, attendeeIds } = buildScheduleInfo();

    try {
      setSavingToTencent(true);
      await scheduleTencentMeeting({
        userId: currentUser.id,
        roomId: rid,
        roomName: roomName.trim() || `研讨会 - ${item.name}`,
        scheduleStartTime: scheduleStartTimestamp,
        scheduleEndTime: scheduleEndTimestamp,
        scheduleAttendees: attendeeIds.length > 0 ? attendeeIds : undefined,
        isAllMicrophoneDisabled: isMicrophoneDisableForAllUser,
        isAllCameraDisabled: isCameraDisableForAllUser,
      });
      message.success('本地配置已保存，并已同步到 Tencent');
      setTencentConfirmed(true);
    } catch (error) {
      console.error('[MaterialView] scheduleTencentMeeting failed:', error);
      message.warning('本地配置已保存，但同步 Tencent 失败');
    } finally {
      setSavingToTencent(false);
    }
  };

  const handleStartLive = async () => {
    const rid = roomId || String(Math.floor(100000 + Math.random() * 900000));
    if (!currentUser?.id) {
      message.error('未获取到当前用户信息');
      return;
    }
    try {
      await launchDesktopMeeting({
        memberId: currentUser.id,
        roomId: rid,
        roomName: roomName.trim() || `研讨会 - ${item.name}`,
      });
    } catch (err: any) {
      console.error('[MaterialView] launchDesktopMeeting failed:', err);
      if (err?.message === 'DESKTOP_NOT_INSTALLED') {
        message.warning('未检测到会议桌面端，请先安装"腾讯会议白板"应用');
      } else {
        message.error('启动桌面端会议失败');
      }
    }
  };

  const renderSettings = () => (
    <div className={styles.settingsForm}>

      {/* roomName */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>
          <span className={styles.required}>*</span> 房间名称
        </label>
        <div className={styles.formControl}>
          <Input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className={styles.formInput}
            placeholder={`请输入${typeLabel}主题`}
            maxLength={20}
          />
          <div className={styles.formNotice}>说明：房间名称最多 20 字。</div>
        </div>
      </div>

      {/* scheduleStartTime */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>开始时间</label>
        <div className={styles.formControl}>
          <div className={styles.timeRow}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
            <Select
              value={startHour}
              onChange={(nextHour) => updateStartTimeValue(nextHour, startMinute)}
              options={START_HOUR_OPTIONS}
              className={styles.timeHourSelect}
              popupMatchSelectWidth={false}
            />
            <span className={styles.timeUnit}>时</span>
            <Select
              value={startMinute}
              onChange={(nextMinute) => updateStartTimeValue(startHour, nextMinute)}
              options={START_MINUTE_OPTIONS}
              className={styles.timeMinuteSelect}
              popupMatchSelectWidth={false}
            />
            <span className={styles.timeUnit}>分</span>
          </div>
        </div>
      </div>

      {/* scheduleDuration */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>会议时长</label>
        <div className={styles.formControl}>
          <div className={styles.durationRow}>
            <Select
              value={durationHours}
              onChange={handleDurationHourChange}
              options={DURATION_HOUR_OPTIONS}
              className={styles.durationHourSelect}
              popupMatchSelectWidth={false}
            />
            <span className={styles.timeUnit}>时</span>
            <Select
              value={durationMinutes}
              onChange={handleDurationMinuteChange}
              options={durationMinuteOptions}
              className={styles.durationMinuteSelect}
              popupMatchSelectWidth={false}
            />
            <span className={styles.timeUnit}>分</span>
          </div>
        </div>
      </div>

      <div className={styles.formNoticeBlock}>
        说明：开始时间必须晚于当前时间；会议时长至少 15 分钟，最长 24 小时。
      </div>

      {/* scheduleAttendees */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>参会成员</label>
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
        bizId={item.bizId ?? ''}
        onCancel={() => setSelectPeopleOpen(false)}
        onConfirm={({ users }) => {
          // 这里只保留用户实体，避免把部门 ID 当成腾讯参会人 userId 传出去。
          const merged = [...selectedAttendeeObjects];
          users.forEach((p) => {
            if (!merged.find((m) => m.id === p.id)) merged.push(p);
          });
          setSelectedAttendeeObjects(merged);
          setSelectPeopleOpen(false);
        }}
      />

      <div className={styles.formDivider} />

      {/* 成员管理 → isMicrophoneDisableForAllUser / isCameraDisableForAllUser */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>成员管理</label>
        <div className={styles.formControl}>
          <div className={styles.checkRow}>
            <div className={styles.checkItem}>
              <Checkbox
                checked={isMicrophoneDisableForAllUser}
                disabled={shouldLockMemberManageConfig}
                onChange={(e) => setIsMicrophoneDisableForAllUser(e.target.checked)}
              >
                全体静音
              </Checkbox>
            </div>
            <div className={styles.checkItem}>
              <Checkbox
                checked={isCameraDisableForAllUser}
                disabled={shouldLockMemberManageConfig}
                onChange={(e) => setIsCameraDisableForAllUser(e.target.checked)}
              >
                全体静画
              </Checkbox>
            </div>
          </div>
          {shouldLockMemberManageConfig && (
            <div className={styles.formNotice}>
              说明：该配置仅新建会议时生效，修改需重建会议。
            </div>
          )}
        </div>
      </div>

      <div className={styles.formDivider} />

      <div className={styles.formActions}>
        <Button
          type="primary"
          className={styles.saveBtn}
          onClick={() => void handleSave()}
          loading={savingToTencent}
        >
          保存
        </Button>
        <Button className={styles.cancelBtn}>取消</Button>
      </div>

      {syncingTencentConfig && (
        <div className={styles.launchNotice}>
          <InfoCircleOutlined style={{ marginRight: 6 }} />
          正在从 Tencent 同步已预约的会议配置…
        </div>
      )}

      {/* 邀请链接 — 腾讯侧确认预约成功且有参会成员时展示 */}
      {tencentConfirmed && roomId && selectedAttendeeObjects.length > 0 && (
        <div className={styles.inviteSection}>
          <div className={styles.inviteSectionHeader}>
            <LinkOutlined style={{ marginRight: 6 }} />
            邀请链接
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              style={{ marginLeft: 8 }}
              onClick={() => {
                const all = selectedAttendeeObjects
                  .map(u => `${u.name}：${getInviteLink(u.id)}`)
                  .join('\n');
                navigator.clipboard.writeText(all);
                message.success('已复制全部邀请链接');
              }}
            >
              一键复制全部
            </Button>
          </div>
          <div className={styles.inviteList}>
            {selectedAttendeeObjects.map((u) => {
              const link = getInviteLink(u.id);
              return (
                <div key={u.id} className={styles.inviteItem}>
                  <span className={styles.inviteName}>{u.name}</span>
                  <span className={styles.inviteLink}>{link}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    className={styles.inviteCopyBtn}
                    onClick={() => {
                      navigator.clipboard.writeText(link);
                      message.success(`已复制 ${u.name} 的链接`);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderLaunch = () => {
    const durationLabel = formatDurationLabel(duration);

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
              <TeamOutlined style={{ fontSize: 28, color: '#4A90D9' }} />
            </div>
            <div className={styles.launchMeta}>
              <div className={styles.launchTitle}>{roomName || `未命名${typeLabel}`}</div>
              <span className={styles.launchBadge} data-type="seminar">
                研讨会
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
                <span className={styles.launchInfoValue}>{startDate} {startTime}</span>
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
            </div>
          </div>

          {/* ── 成员管理 ── */}
          <div className={styles.launchSection}>
            <div className={styles.launchSectionTitle}>成员管理</div>
            <div className={styles.launchDeviceGrid}>
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
              icon={<LoginOutlined />}
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
    const durationLabel = formatDurationLabel(duration);
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
            <span className={styles.detailTypeBadge} data-type="seminar">
              研讨会
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
          <TeamOutlined style={{ color: '#4A90D9', fontSize: 16 }} />
          <span className={styles.viewTitle}>
            {roomName || `未命名${typeLabel}`}
          </span>
        </div>
        <div className={styles.navCenter}>
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
            icon={<LoginOutlined />}
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
        </div>
      </div>

      <div className={styles.mainArea}>
        {activeTab === 'settings' ? renderSettings() : activeTab === 'launch' ? renderLaunch() : renderDetails()}
      </div>
    </div>
  );
};

export default MaterialView;
