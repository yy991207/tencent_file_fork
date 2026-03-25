/**
 * 云电脑视图组件
 * 配置项：云电脑名称、镜像、CPU、内存、磁盘
 * 页签：配置（settings）+ 运行（run）
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Select, message } from 'antd';
import {
  SettingOutlined,
  PlayCircleOutlined,
  DesktopOutlined,
  WindowsOutlined,
  CodeOutlined,
  CloudServerOutlined,
  HddOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import type { MaterialItem, CloudDesktopStatus } from '../../types';
import styles from './index.module.less';

type CloudDesktopTab = 'settings' | 'run';

interface CloudDesktopViewProps {
  item: MaterialItem;
  onNameChange?: (id: string, newName: string) => void;
}

/** 预设镜像 */
const IMAGE_OPTIONS = [
  { value: 'win11', label: 'Windows 11 Pro', desc: '64位 专业版', icon: <WindowsOutlined style={{ color: '#0078D4' }} />, bgColor: '#EFF6FF' },
  { value: 'ubuntu2204', label: 'Ubuntu 22.04 LTS', desc: '长期支持版', icon: <CodeOutlined style={{ color: '#E95420' }} />, bgColor: '#FFF7ED' },
  { value: 'centos79', label: 'CentOS 7.9', desc: '稳定服务器版', icon: <CloudServerOutlined style={{ color: '#932279' }} />, bgColor: '#FDF4FF' },
  { value: 'debian12', label: 'Debian 12', desc: '社区稳定版', icon: <CloudServerOutlined style={{ color: '#A80030' }} />, bgColor: '#FFF1F2' },
];

const CPU_OPTIONS = [2, 4, 8, 16];
const MEM_OPTIONS = [4, 8, 16, 32];
const DISK_OPTIONS = [50, 100, 200, 500];

const STATUS_MAP: Record<CloudDesktopStatus, { label: string; className: string }> = {
  'not-created': { label: '未创建', className: styles.statusNotCreated },
  'stopped': { label: '已停止', className: styles.statusStopped },
  'running': { label: '运行中', className: styles.statusRunning },
  'restarting': { label: '重启中', className: styles.statusRestarting },
};

const CloudDesktopView: React.FC<CloudDesktopViewProps> = ({ item, onNameChange }) => {
  const updateCloudDesktopConfig = useAppStore((s) => s.updateCloudDesktopConfig);
  const updateCloudDesktopStatus = useAppStore((s) => s.updateCloudDesktopStatus);

  const [activeTab, setActiveTab] = useState<CloudDesktopTab>('settings');
  const [desktopName, setDesktopName] = useState('');
  const [imageId, setImageId] = useState('win11');
  const [cpuCores, setCpuCores] = useState(4);
  const [memoryGB, setMemoryGB] = useState(8);
  const [diskGB, setDiskGB] = useState(100);
  const [saved, setSaved] = useState(false);

  // 防止 unmount 后更新 state
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const status: CloudDesktopStatus = item.cloudDesktopConfig?.status ?? 'not-created';

  // 切换 item 时还原配置
  useEffect(() => {
    const cfg = item.cloudDesktopConfig;
    setDesktopName(cfg?.desktopName ?? '');
    setImageId(cfg?.imageId ?? 'win11');
    setCpuCores(cfg?.cpuCores ?? 4);
    setMemoryGB(cfg?.memoryGB ?? 8);
    setDiskGB(cfg?.diskGB ?? 100);
    setSaved(!!cfg?.desktopName);
    setActiveTab('settings');
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedImage = IMAGE_OPTIONS.find((img) => img.value === imageId) ?? IMAGE_OPTIONS[0];

  /** 保存配置 */
  const handleSave = () => {
    if (!desktopName.trim()) {
      message.warning('请输入云电脑名称');
      return;
    }
    const image = IMAGE_OPTIONS.find((img) => img.value === imageId);
    updateCloudDesktopConfig(item.id, {
      desktopName: desktopName.trim(),
      imageId,
      imageName: image?.label,
      cpuCores,
      memoryGB,
      diskGB,
      status: status === 'not-created' ? 'stopped' : status,
    });
    onNameChange?.(item.id, desktopName.trim());
    setSaved(true);
    message.success('云电脑配置已保存');
  };

  /** 启动 */
  const handleStart = () => {
    updateCloudDesktopStatus(item.id, 'running');
    message.success('云电脑已启动');
  };

  /** 关机 */
  const handleStop = () => {
    updateCloudDesktopStatus(item.id, 'stopped');
    message.success('云电脑已关机');
  };

  /** 重启 */
  const handleRestart = () => {
    updateCloudDesktopStatus(item.id, 'restarting');
    message.info('云电脑重启中…');
    setTimeout(() => {
      if (mountedRef.current) {
        updateCloudDesktopStatus(item.id, 'running');
        message.success('云电脑已重启完成');
      }
    }, 2000);
  };

  // ── 配置页签 ──
  const renderSettings = () => (
    <div className={styles.settingsForm}>
      {/* 云电脑名称 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}><span className={styles.required}>*</span> 名称</label>
        <div className={styles.formControl}>
          <Input
            className={styles.formInput}
            placeholder="请输入云电脑名称"
            value={desktopName}
            onChange={(e) => setDesktopName(e.target.value)}
            maxLength={50}
          />
        </div>
      </div>

      {/* 镜像选择 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}><span className={styles.required}>*</span> 系统镜像</label>
        <div className={styles.formControl}>
          <div className={styles.imageCards}>
            {IMAGE_OPTIONS.map((img) => (
              <div
                key={img.value}
                className={`${styles.imageCard} ${imageId === img.value ? styles.imageCardSelected : ''}`}
                onClick={() => setImageId(img.value)}
              >
                <div className={styles.imageCardIcon} style={{ background: img.bgColor }}>
                  {img.icon}
                </div>
                <div className={styles.imageCardInfo}>
                  <div className={styles.imageCardName}>{img.label}</div>
                  <div className={styles.imageCardDesc}>{img.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.formDivider} />

      {/* CPU */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>CPU 核心</label>
        <div className={styles.formControl}>
          <Select
            className={styles.formSelect}
            value={cpuCores}
            onChange={(v) => setCpuCores(v)}
            options={CPU_OPTIONS.map((c) => ({ value: c, label: `${c} 核` }))}
          />
        </div>
      </div>

      {/* 内存 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>内存</label>
        <div className={styles.formControl}>
          <Select
            className={styles.formSelect}
            value={memoryGB}
            onChange={(v) => setMemoryGB(v)}
            options={MEM_OPTIONS.map((m) => ({ value: m, label: `${m} GB` }))}
          />
        </div>
      </div>

      {/* 系统盘 */}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>系统盘</label>
        <div className={styles.formControl}>
          <Select
            className={styles.formSelect}
            value={diskGB}
            onChange={(v) => setDiskGB(v)}
            options={DISK_OPTIONS.map((d) => ({ value: d, label: `${d} GB` }))}
          />
        </div>
      </div>

      {/* 保存 */}
      <div className={styles.formActions}>
        <Button type="primary" className={styles.saveBtn} onClick={handleSave}>
          保存配置
        </Button>
      </div>
    </div>
  );

  // ── 运行页签 ──
  const renderRun = () => {
    if (!saved) {
      return (
        <div className={styles.runView}>
          <div className={styles.runNotice}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            请先在「配置」页签中保存云电脑配置
          </div>
        </div>
      );
    }

    const statusInfo = STATUS_MAP[status];

    return (
      <div className={styles.runView}>
        <div className={styles.runCard}>
          {/* 标题 */}
          <div className={styles.runHeader}>
            <div className={styles.runIconWrap}>
              <DesktopOutlined />
            </div>
            <div className={styles.runMeta}>
              <div className={styles.runTitle}>{item.cloudDesktopConfig?.desktopName || '云电脑'}</div>
              <div className={`${styles.statusBadge} ${statusInfo.className}`}>
                <span className={styles.statusDot} data-status={status} />
                {statusInfo.label}
              </div>
            </div>
          </div>

          {/* 配置摘要 */}
          <div className={styles.runSection}>
            <div className={styles.runSectionTitle}>配置信息</div>
            <div className={styles.runInfoList}>
              <div className={styles.runInfoRow}>
                <DesktopOutlined className={styles.runInfoIcon} />
                <span className={styles.runInfoLabel}>系统镜像</span>
                <span className={styles.runInfoValue}>{selectedImage.label}</span>
              </div>
              <div className={styles.runInfoRow}>
                <DashboardOutlined className={styles.runInfoIcon} />
                <span className={styles.runInfoLabel}>CPU</span>
                <span className={styles.runInfoValue}>{cpuCores} 核</span>
              </div>
              <div className={styles.runInfoRow}>
                <HddOutlined className={styles.runInfoIcon} />
                <span className={styles.runInfoLabel}>内存</span>
                <span className={styles.runInfoValue}>{memoryGB} GB</span>
              </div>
              <div className={styles.runInfoRow}>
                <DatabaseOutlined className={styles.runInfoIcon} />
                <span className={styles.runInfoLabel}>系统盘</span>
                <span className={styles.runInfoValue}>{diskGB} GB</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className={styles.runActions}>
            <Button
              type="primary"
              className={styles.runActionBtn}
              icon={<PlayCircleOutlined />}
              disabled={status === 'running' || status === 'restarting'}
              onClick={handleStart}
              style={{ background: status === 'running' || status === 'restarting' ? undefined : '#10B981', borderColor: '#10B981' }}
            >
              启动
            </Button>
            <Button
              danger
              className={styles.runActionBtn}
              icon={<PoweroffOutlined />}
              disabled={status === 'stopped' || status === 'not-created'}
              onClick={handleStop}
            >
              关机
            </Button>
            <Button
              className={styles.runActionBtn}
              icon={<ReloadOutlined />}
              disabled={status === 'stopped' || status === 'not-created' || status === 'restarting'}
              onClick={handleRestart}
            >
              重启
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.cloudDesktopView}>
      {/* 顶部导航 */}
      <div className={styles.topNav}>
        <div className={styles.navLeft}>
          <DesktopOutlined style={{ fontSize: 18, color: '#10B981' }} />
          <span className={styles.viewTitle}>{item.name || '云电脑'}</span>
        </div>
        <div className={styles.navRight}>
          <Button
            className={`${styles.actionBtn} ${activeTab === 'settings' ? styles.actionBtnActive : ''}`}
            icon={<SettingOutlined />}
            type="link"
            onClick={() => setActiveTab('settings')}
          >
            配置
          </Button>
          <Button
            className={`${styles.actionBtnPrimary} ${activeTab === 'run' ? styles.actionBtnActive : ''}`}
            icon={<PlayCircleOutlined />}
            type="link"
            onClick={() => setActiveTab('run')}
          >
            运行
          </Button>
        </div>
      </div>

      {/* 主内容 */}
      <div className={styles.mainArea}>
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'run' && renderRun()}
      </div>
    </div>
  );
};

export default CloudDesktopView;
