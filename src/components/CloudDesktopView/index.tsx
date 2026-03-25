/**
 * 云电脑视图组件
 * 配置项：云电脑名称、镜像市场选择、CPU、内存、磁盘
 * 页签：配置（settings）+ 运行（run）
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
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import type { MaterialItem, CloudDesktopStatus } from '../../types';
import styles from './index.module.less';

type CloudDesktopTab = 'settings' | 'run';

interface CloudDesktopViewProps {
  item: MaterialItem;
  onNameChange?: (id: string, newName: string) => void;
}

/** 镜像市场数据 */
interface ImageItem {
  id: string;
  name: string;
  imageId: string;
  os: 'Windows' | 'Linux';
  tags: string[];
  rating: number;
  diskSize: string;
  updatedAt: string;
  publisherUid: string;
  icon: React.ReactNode;
  iconBg: string;
  category: string;
}

const COMMUNITY_IMAGES: ImageItem[] = [
  {
    id: 'img-wps365', name: '金山WPS365-AI一体化办公', imageId: 'img-0aae4rxv6py6e9g63',
    os: 'Windows', tags: ['WPS'], rating: 4, diskSize: '50 GiB', updatedAt: '2026-03-16 18:16:36',
    publisherUid: '190934003905...', icon: <span style={{ fontSize: 22, fontWeight: 700, color: '#D4380D' }}>W</span>, iconBg: '#FFF2E8',
    category: '通用办公',
  },
  {
    id: 'img-openclaw', name: 'OpenClaw & CoPaw & OpenWork', imageId: 'img-0aae4rxv3pz7idcot',
    os: 'Windows', tags: ['AI助手'], rating: 4, diskSize: '60 GiB', updatedAt: '2026-03-10 22:11:21',
    publisherUid: '190934003905...', icon: <span style={{ fontSize: 18, fontWeight: 800, color: '#1890FF' }}>CP</span>, iconBg: '#E6F7FF',
    category: '代码开发',
  },
  {
    id: 'img-codingplan', name: 'cucloud_codingplan', imageId: 'img-0aae4rgm4ln3bd5ae',
    os: 'Windows', tags: ['AI助手'], rating: 5, diskSize: '100 GiB', updatedAt: '2026-02-27 23:40:28',
    publisherUid: '190934003905...', icon: <CloudServerOutlined style={{ fontSize: 22, color: '#722ED1' }} />, iconBg: '#F9F0FF',
    category: '代码开发',
  },
  {
    id: 'img-mirror', name: 'cucloud_mirror', imageId: 'img-0ae8jv3bm0ao1hx5m',
    os: 'Windows', tags: ['AI'], rating: 4, diskSize: '50 GiB', updatedAt: '2026-02-03 14:56:12',
    publisherUid: '144886568182...', icon: <CloudServerOutlined style={{ fontSize: 22, color: '#1890FF' }} />, iconBg: '#E6F7FF',
    category: 'AI助手',
  },
  {
    id: 'img-clawdbot', name: 'OpenClaw(Clawdbot)', imageId: 'img-0ae8jvkn4tzatayay',
    os: 'Linux', tags: ['AI助手'], rating: 4, diskSize: '40 GiB', updatedAt: '2026-03-17 11:35:33',
    publisherUid: '190934003905...', icon: <CodeOutlined style={{ fontSize: 22, color: '#FA541C' }} />, iconBg: '#FFF2E8',
    category: 'AI助手',
  },
  {
    id: 'img-aisimu', name: '具身智能_AI仿真核心包', imageId: 'img-0aae4rgit4jlxn5of',
    os: 'Linux', tags: ['AI', '具身智能'], rating: 5, diskSize: '250 GiB', updatedAt: '2026-01-20 15:29:22',
    publisherUid: '148211952035...', icon: <DashboardOutlined style={{ fontSize: 22, color: '#13C2C2' }} />, iconBg: '#E6FFFB',
    category: 'AI助手',
  },
  {
    id: 'img-comfyui-ubuntu', name: 'ComfyUI-Ubuntu系统纯净版', imageId: 'img-0aae4rgipgeiliwnn',
    os: 'Linux', tags: ['ComfyUI', '图像'], rating: 4, diskSize: '400 GiB', updatedAt: '2026-01-13 12:01:10',
    publisherUid: '190934003905...', icon: <span style={{ fontSize: 18, fontWeight: 800, color: '#52C41A' }}>UI</span>, iconBg: '#F6FFED',
    category: '设计渲染',
  },
  {
    id: 'img-industry-design', name: '工业设计_专业渲染版', imageId: 'img-0a8urjaeew2ewsdpb',
    os: 'Windows', tags: ['设计渲染'], rating: 4, diskSize: '70 GiB', updatedAt: '2026-01-12 12:14:51',
    publisherUid: '190934003905...', icon: <span style={{ fontSize: 18, color: '#1890FF' }}>3D</span>, iconBg: '#E6F7FF',
    category: '设计渲染',
  },
  {
    id: 'img-security', name: '安全开发_全栈工具集', imageId: 'img-0aae4rgleniusunl0',
    os: 'Windows', tags: ['代码开发'], rating: 4, diskSize: '100 GiB', updatedAt: '2026-01-08 11:47:39',
    publisherUid: '190934003905...', icon: <span style={{ fontSize: 18, fontWeight: 700, color: '#52C41A' }}>&lt;/&gt;</span>, iconBg: '#F6FFED',
    category: '代码开发',
  },
  {
    id: 'img-ecommerce', name: '全平台运营_电商工作台集成', imageId: 'img-0aae4rglenjvrqliv',
    os: 'Windows', tags: ['电商运营'], rating: 4, diskSize: '50 GiB', updatedAt: '2026-01-08 11:41:55',
    publisherUid: '190934003905...', icon: <span style={{ fontSize: 22, color: '#1890FF' }}>🛒</span>, iconBg: '#E6F7FF',
    category: '通用办公',
  },
  {
    id: 'img-virtual-live', name: '虚拟直播_多平台适配版', imageId: 'img-0aae4rglenhwqmjmp',
    os: 'Windows', tags: ['数字人直播'], rating: 4, diskSize: '60 GiB', updatedAt: '2026-01-08 11:37:34',
    publisherUid: '190934003905...', icon: <PlayCircleOutlined style={{ fontSize: 22, color: '#13C2C2' }} />, iconBg: '#E6FFFB',
    category: '设计渲染',
  },
  {
    id: 'img-enterprise-office', name: '企业办公_高效协作套件', imageId: 'img-0aae4rglendyoefof',
    os: 'Windows', tags: ['通用办公', '外包客服', '分支门店'], rating: 4, diskSize: '50 GiB', updatedAt: '2026-01-08 11:29:12',
    publisherUid: '190934003905...', icon: <DesktopOutlined style={{ fontSize: 22, color: '#722ED1' }} />, iconBg: '#F9F0FF',
    category: '通用办公',
  },
];

const CATEGORIES = ['全部', 'AI助手', '代码开发', '设计渲染', '教育培训', '通用办公'];

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
  const [selectedImageId, setSelectedImageId] = useState('img-wps365');
  const [saved, setSaved] = useState(false);

  // 镜像筛选状态
  const [imageSearch, setImageSearch] = useState('');
  const [imageCategory, setImageCategory] = useState('全部');
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
    setSelectedImageId(cfg?.imageId ?? 'img-wps365');
    setSaved(!!cfg?.desktopName);
    setActiveTab('settings');
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 过滤镜像列表
  const filteredImages = useMemo(() => {
    let list = COMMUNITY_IMAGES;
    if (imageCategory !== '全部') {
      list = list.filter((img) => img.category === imageCategory);
    }
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

  const selectedImage = COMMUNITY_IMAGES.find((img) => img.id === selectedImageId);

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
    const image = COMMUNITY_IMAGES.find((img) => img.id === selectedImageId);
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

      {/* 镜像选择 — 全宽区块 */}
      <div className={styles.formSectionLabel}>
        <span className={styles.required}>*</span> 选择系统镜像
      </div>

      {/* 筛选行：分类标签 + 搜索 */}
      <div className={styles.filterRow}>
        <div className={styles.filterCats}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`${styles.filterCat} ${imageCategory === cat ? styles.filterCatActive : ''}`}
              onClick={() => setImageCategory(cat)}
            >
              {cat}
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
                {img.icon}
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

      <div className={styles.mainArea}>
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'run' && renderRun()}
      </div>
    </div>
  );
};

export default CloudDesktopView;
