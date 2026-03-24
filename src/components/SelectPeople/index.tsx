/**
 * 选择联系人弹窗
 * 源自 /Users/yang/select-people，集成到主应用
 *
 * Props:
 *   open       — 是否显示
 *   onConfirm  — 确认回调，参数 { users: User[], depts: Dept[] }
 *   onCancel   — 取消/关闭回调
 */
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Modal, Spin } from 'antd';
import Breadcrumb from './components/Breadcrumb.jsx';
import OrgList from './components/OrgList.jsx';
import SearchBar from './components/SearchBar.jsx';
import SelectedPanel from './components/SelectedPanel.jsx';
import { buildDeptPath, buildDeptUsersMap, normalizeOrgData, searchInDept } from './utils/orgData.js';
import { useAppStore } from '@/store';
import './styles.css';

// 由 vite.config.ts 从 config.yaml 注入（调试用兜底，不写明文）
declare const __DEBUG_TOKEN__: string;
declare const __DEBUG_BIZ_ID__: string;

const INITIAL_PAGE_SIZE = 18;

interface ApiMember {
  id: string;
  memberId: string;
  memberName: string;
  memberType: 1 | 2; // 1=个人用户, 2=组织/部门
}

function transformApiResponse(members: ApiMember[]) {
  const departs = members
    .filter((m) => m.memberType === 2)
    .map((m) => ({ id: m.memberId, departName: m.memberName }));
  const users = members
    .filter((m) => m.memberType === 1)
    .map((m) => ({ id: m.memberId, realname: m.memberName }));
  return { departs, users };
}

interface User { id: string; name: string; title?: string; avatar?: string; }
interface Dept { id: string; name: string; }

interface SelectPeopleModalProps {
  open: boolean;
  bizId: string;
  onConfirm: (result: { users: User[]; depts: Dept[] }) => void;
  onCancel: () => void;
}

export default function SelectPeopleModal({ open, bizId, onConfirm, onCancel }: SelectPeopleModalProps) {
  const currentUser = useAppStore((s) => s.currentUser);
  const [path, setPath] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<string>>(() => new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(() => new Set());
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const [dataState, setDataState] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 每次打开重置状态并拉取接口数据
  useEffect(() => {
    // bizId 优先用 prop，prop 为空时回退到 config.yaml 注入的调试值
    const effectiveBizId = bizId || __DEBUG_BIZ_ID__;
    if (!open || !effectiveBizId) return;

    setPath([]);
    setQuery('');
    setSelectedDeptIds(new Set());
    setSelectedUserIds(new Set());
    setVisibleCount(INITIAL_PAGE_SIZE);
    setDataState(null);
    setLoading(true);

    // token 优先用 store / localStorage，均无时回退到 config.yaml 注入的调试值
    const token = currentUser?.accessToken
      ?? localStorage.getItem('x-access-token')
      ?? __DEBUG_TOKEN__;

    fetch(`/jeecg-boot/sys/bizMember/${effectiveBizId}/list`, {
      headers: {
        'x-access-token': token,
        'content-type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.result)) {
          const normalized = transformApiResponse(json.result as ApiMember[]);
          setDataState(normalizeOrgData({ result: normalized }));
        } else {
          setDataState({ error: new Error(json.message || '接口返回数据异常') });
        }
      })
      .catch((err) => setDataState({ error: err }))
      .finally(() => setLoading(false));
  }, [open, bizId]);

  const data = dataState?.root ? dataState : null;
  const error = dataState?.error;

  const currentNode = useMemo(() => {
    if (!data) return null;
    return path.length ? path[path.length - 1] : (data as any).root;
  }, [data, path]);

  const deptUsersMap = useMemo(() => {
    if (!data) return new Map();
    return buildDeptUsersMap((data as any).root);
  }, [data]);

  const selectedUsersByDept = useMemo(() => {
    const set = new Set<string>();
    selectedDeptIds.forEach((deptId) => {
      const users = deptUsersMap.get(deptId);
      if (users) users.forEach((userId: string) => set.add(userId));
    });
    return set;
  }, [deptUsersMap, selectedDeptIds]);

  const { departs, users } = useMemo(() => {
    if (!currentNode) return { departs: [], users: [] };
    return searchInDept(currentNode, deferredQuery);
  }, [currentNode, deferredQuery]);

  const combined = useMemo(
    () => [...departs.map((d: any) => ({ type: 'dept', node: d })), ...users.map((u: any) => ({ type: 'user', node: u }))],
    [departs, users]
  );

  const visibleCombined = useMemo(() => combined.slice(0, visibleCount), [combined, visibleCount]);
  const visibleDeparts = visibleCombined.filter((i: any) => i.type === 'dept').map((i: any) => i.node);
  const visibleUsers  = visibleCombined.filter((i: any) => i.type === 'user').map((i: any) => i.node);
  const hasMore = visibleCombined.length < combined.length;

  useEffect(() => { setVisibleCount(INITIAL_PAGE_SIZE); }, [deferredQuery]);

  const selectedDeptList = useMemo(() => {
    if (!data) return [];
    return [...selectedDeptIds].map((id) => (data as any).deptMap.get(id)).filter(Boolean);
  }, [data, selectedDeptIds]);

  const selectedUserList = useMemo(() => {
    if (!data) return [];
    return [...selectedUserIds].map((id) => (data as any).userMap.get(id)).filter(Boolean);
  }, [data, selectedUserIds]);

  const resetPath = useCallback(() => { setPath([]); setQuery(''); setVisibleCount(INITIAL_PAGE_SIZE); }, []);

  const handleNavigateDept = useCallback((dept: any) => {
    if (!data) return;
    setPath(buildDeptPath(dept.id, (data as any).parentMap, (data as any).deptMap));
    setQuery('');
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [data]);

  const handleToggleDept = useCallback((dept: any) => {
    setSelectedDeptIds((prev) => { const next = new Set(prev); next.has(dept.id) ? next.delete(dept.id) : next.add(dept.id); return next; });
  }, []);

  const handleToggleUser = useCallback((user: any) => {
    setSelectedUserIds((prev) => { const next = new Set(prev); next.has(user.id) ? next.delete(user.id) : next.add(user.id); return next; });
  }, []);

  const handleRemoveUser = useCallback((user: any) => {
    setSelectedUserIds((prev) => { const next = new Set(prev); next.delete(user.id); return next; });
  }, []);

  const handleRemoveDept = useCallback((dept: any) => {
    setSelectedDeptIds((prev) => { const next = new Set(prev); next.delete(dept.id); return next; });
  }, []);

  const handleLoadMore = useCallback(() => { setVisibleCount((p) => p + INITIAL_PAGE_SIZE); }, []);

  const handleConfirm = () => {
    onConfirm({ users: selectedUserList as User[], depts: selectedDeptList as Dept[] });
  };

  return (
    <Modal
      open={open}
      title="选择联系人"
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="确认"
      cancelText="取消"
      width={980}
      styles={{ body: { padding: 0 } }}
      destroyOnHidden
    >
      <div className="sp-root">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Spin tip="加载中..." />
          </div>
        ) : error ? (
          <div className="error">{(error as any).message}</div>
        ) : !data || !currentNode ? null : (
          <div className="dialog-body">
            <div className="panel left-panel">
              <div className="panel-header">
                <SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} />
                <Breadcrumb path={path} onReset={resetPath} />
              </div>
              <div className="panel-body">
                <OrgList
                  departs={visibleDeparts}
                  users={visibleUsers}
                  query={deferredQuery}
                  onNavigateDept={handleNavigateDept}
                  onToggleDept={handleToggleDept}
                  onToggleUser={handleToggleUser}
                  selectedDeptIds={selectedDeptIds}
                  selectedUserIds={selectedUserIds}
                  selectedUsersByDept={selectedUsersByDept}
                  deptUsersMap={deptUsersMap}
                  hasMore={hasMore}
                  onLoadMore={handleLoadMore}
                />
              </div>
            </div>
            <SelectedPanel
              selectedUsers={selectedUserList}
              selectedDepts={selectedDeptList}
              onRemoveUser={handleRemoveUser}
              onRemoveDept={handleRemoveDept}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
