/**
 * 云电脑视图组件
 * 配置项：云电脑名称、镜像市场选择、CPU、内存、磁盘
 * 页签：配置（settings）+ 运行（run）
 * 镜像数据从 mock JSON 加载，图标根据 JSON 配置动态渲染
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Input, message, Pagination, Tag } from 'antd';
import {
  SettingOutlined,
  PlayCircleOutlined,
  DesktopOutlined,
  WindowsOutlined,
  CodeOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  StarFilled,
  CheckCircleFilled,
  ShoppingCartOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import type { MaterialItem, CloudDesktopStatus } from '../../types';
import cloudImagesData from '../../../interface-structure/cloud-images.json';
import styles from './index.module.less';

type CloudDesktopTab = 'settings' | 'run';

interface CloudDesktopViewProps {
  item: MaterialItem;
  onNameChange?: (id: string, newName: string) => void;
}

// ── JSON 数据类型 ──
interface IconConfig {
  type: 'text' | 'antd';
  text?: string;
  name?: string;
  fontSize: number;
  fontWeight?: number;
  color: string;
}

interface RawImageItem {
  id: string;
  name: string;
  imageId: string;
  os: 'Windows' | 'Linux';
  tags: string[];
  rating: number;
  diskSize: string;
  updatedAt: string;
  publisherUid: string;
  icon: IconConfig;
  iconBg: string;
  category: string;
}

interface ImageTab {
  key: string;
  label: string;
  isNew?: boolean;
}

// ── antd 图标名称到组件的映射 ──
const ANTD_ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  CloudServerOutlined,
  CodeOutlined,
  DashboardOutlined,
  PlayCircleOutlined,
  DesktopOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
};

// 根据 JSON 中的图标配置渲染对应的 React 图标
const renderIcon = (cfg: IconConfig): React.ReactNode => {
  if (cfg.type === 'antd') {
    const IconComp = ANTD_ICON_MAP[cfg.name || ''];
    if (IconComp) {
      return <IconComp style={{ fontSize: cfg.fontSize, color: cfg.color }} />;
    }
    // 兜底：未匹配到的 antd 图标用首字母
    return <span style={{ fontSize: cfg.fontSize, color: cfg.color }}>{(cfg.name || '?')[0]}</span>;
  }
  // type === 'text'
  return (
    <span style={{ fontSize: cfg.fontSize, fontWeight: cfg.fontWeight ?? 400, color: cfg.color }}>
      {cfg.text}
    </span>
  );
};

// ── 从 JSON 加载页签和镜像数据 ──
const IMAGE_TABS: ImageTab[] = cloudImagesData.tabs;
const ALL_IMAGES: RawImageItem[] = cloudImagesData.images as RawImageItem[];

// "全部镜像"使用固定 key
const ALL_TAB_KEY = '全部镜像';

const STATUS_MAP: Record<CloudDesktopStatus, { label: string; className: string }> = {
  'not-created': { label: '未创建', className: styles.statusNotCreated },
  'stopped': { label: '已停止', className: styles.statusStopped },
  'running': { label: '运行中', className: styles.statusRunning },
  'restarting': { label: '重启中', className: styles.statusRestarting },
};

const PAGE_SIZE = 6;

const CloudDesktopView: React.FC<CloudDesktopViewProps> = ({ item, onNameChange }) => {
  const updateCloudDesktopConfig = useAppStore((s) => s.updateCloudDesktopConfig);
  const updateCloudDesktopStatus = useAppStore((s) => s.updateCloudDesktopStatus);

  const [activeTab, setActiveTab] = useState<CloudDesktopTab>('settings');
  const [desktopName, setDesktopName] = useState('');
  const [selectedImageId, setSelectedImageId] = useState(ALL_IMAGES[0]?.id ?? '');
  const [saved, setSaved] = useState(false);

  // 镜像筛选状态，默认选中"全部镜像"
  const [imageSearch, setImageSearch] = useState('');
  const [imageCategory, setImageCategory] = useState(ALL_TAB_KEY);
  const [imagePage, setImagePage] = useState(1);

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
    setSelectedImageId(cfg?.imageId ?? ALL_IMAGES[0]?.id ?? '');
    setSaved(!!cfg?.desktopName);
    setActiveTab('settings');
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 过滤镜像列表
  const filteredImages = useMemo(() => {
    // "全部镜像"不做分类过滤，其余按 category 匹配
    let list = imageCategory === ALL_TAB_KEY
      ? ALL_IMAGES
      : ALL_IMAGES.filter((img) => img.category === imageCategory);
    if (imageSearch.trim()) {
      const keyword = imageSearch.trim().toLowerCase();
      list = list.filter((img) =>
        img.name.toLowerCase().includes(keyword) ||
        img.imageId.toLowerCase().includes(keyword) ||
        img.tags.some((t) => t.toLowerCase().includes(keyword))
      );
    }
    return list;
  }, [imageCategory, imageSearch]);

  const pagedImages = useMemo(() => {
    const start = (imagePage - 1) * PAGE_SIZE;
    return filteredImages.slice(start, start + PAGE_SIZE);
  }, [filteredImages, imagePage]);

  // 重置分页
  useEffect(() => { setImagePage(1); }, [imageCategory, imageSearch]);

  const selectedImage = ALL_IMAGES.find((img) => img.id === selectedImageId);

  /** 渲染星级 */
  const renderStars = (rating: number) => (
    <span className={styles.imgStars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarFilled key={i} style={{ color: i <= rating ? '#FAAD14' : '#E8E8E8', fontSize: 12 }} />
      ))}
    </span>
  );

  /** 保存配置 */
  const handleSave = () => {
    if (!desktopName.trim()) {
      message.warning('请输入云电脑名称');
      return;
    }
    const image = ALL_IMAGES.find((img) => img.id === selectedImageId);
    updateCloudDesktopConfig(item.id, {
      desktopName: desktopName.trim(),
      imageId: selectedImageId,
      imageName: image?.name,
      status: status === 'not-created' ? 'stopped' : status,
    });
    onNameChange?.(item.id, desktopName.trim());
    setSaved(true);
    message.success('云电脑配置已保存');
  };

  const handleStart = () => {
    updateCloudDesktopStatus(item.id, 'running');
    message.success('云电脑已启动');
  };

  const handleStop = () => {
    updateCloudDesktopStatus(item.id, 'stopped');
    message.success('云电脑已关机');
  };

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
      <div className={styles.formSectionLabel}>
        <span className={styles.required}>*</span> 云电脑名称
      </div>
      <Input
        className={styles.nameInput}
        placeholder="请输入云电脑名称"
        value={desktopName}
        onChange={(e) => setDesktopName(e.target.value)}
        maxLength={50}
        size="large"
      />

      {/* 镜像选择 */}
      <div className={styles.formSectionLabel} style={{ marginTop: 28 }}>
        <span className={styles.required}>*</span> 选择系统镜像
      </div>

      {/* 筛选行：镜像类型页签 + 搜索 */}
      <div className={styles.filterRow}>
        <div className={styles.imageTabs}>
          {/* "全部镜像"始终在最前面 */}
          <div
            className={`${styles.imageTab} ${imageCategory === ALL_TAB_KEY ? styles.imageTabActive : ''}`}
            onClick={() => setImageCategory(ALL_TAB_KEY)}
          >
            全部镜像
          </div>
          {IMAGE_TABS.map((tab) => (
            <div
              key={tab.key}
              className={`${styles.imageTab} ${imageCategory === tab.key ? styles.imageTabActive : ''}`}
              onClick={() => setImageCategory(tab.key)}
            >
              {tab.label}
              {tab.isNew && <span className={styles.newBadge}>NEW</span>}
            </div>
          ))}
        </div>
        <Input
          placeholder="搜索镜像名称或ID"
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          value={imageSearch}
          onChange={(e) => setImageSearch(e.target.value)}
          allowClear
          className={styles.filterSearch}
        />
      </div>

      {/* 镜像卡片 */}
      <div className={styles.imgGrid}>
        {pagedImages.map((img) => (
          <div
            key={img.id}
            className={`${styles.imgCard} ${selectedImageId === img.id ? styles.imgCardSelected : ''}`}
            onClick={() => setSelectedImageId(img.id)}
          >
            {selectedImageId === img.id && (
              <CheckCircleFilled className={styles.imgCardCheck} />
            )}
            <div className={styles.imgCardTop}>
              <div className={styles.imgCardIcon} style={{ background: img.iconBg }}>
                {renderIcon(img.icon)}
              </div>
              <div className={styles.imgCardMeta}>
                <div className={styles.imgCardName}>{img.name}</div>
                <div className={styles.imgCardId}>{img.imageId}</div>
              </div>
              {renderStars(img.rating)}
            </div>
            <div className={styles.imgCardBottom}>
              <div className={styles.imgCardTags}>
                <Tag color={img.os === 'Windows' ? 'blue' : 'orange'} className={styles.imgOsTag}>
                  {img.os === 'Windows' ? <WindowsOutlined /> : <CodeOutlined />} {img.os}
                </Tag>
                {img.tags.map((tag) => (
                  <Tag key={tag} className={styles.imgCatTag}>{tag}</Tag>
                ))}
              </div>
              <div className={styles.imgCardInfo}>
                系统盘/数据盘: {img.diskSize} / - GiB
              </div>
            </div>
          </div>
        ))}
        {pagedImages.length === 0 && (
          <div className={styles.imgEmpty}>暂无匹配镜像</div>
        )}
      </div>

      {/* 分页 */}
      {filteredImages.length > PAGE_SIZE && (
        <div className={styles.imgPagination}>
          <Pagination
            size="small"
            current={imagePage}
            pageSize={PAGE_SIZE}
            total={filteredImages.length}
            onChange={(page) => setImagePage(page)}
            showSizeChanger={false}
          />
        </div>
      )}

      {/* 保存 */}
      <div className={styles.formActionsFull}>
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

          <div className={styles.runSection}>
            <div className={styles.runSectionTitle}>配置信息</div>
            <div className={styles.runInfoList}>
              <div className={styles.runInfoRow}>
                <DesktopOutlined className={styles.runInfoIcon} />
                <span className={styles.runInfoLabel}>系统镜像</span>
                <span className={styles.runInfoValue}>{selectedImage?.name ?? '-'}</span>
              </div>
            </div>
          </div>

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
      <div className={styles.topNav}>
        <div className={styles.navLeft}>
          <DesktopOutlined style={{ fontSize: 18, color: '#10B981' }} />
          <span className={styles.viewTitle}>{item.name || '云电脑'}</span>
        </div>
        <div className={styles.navCenter}>
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

      <div className={styles.mainArea}>
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'run' && renderRun()}
      </div>
    </div>
  );
};

export default CloudDesktopView;
