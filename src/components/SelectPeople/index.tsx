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
import { Modal } from 'antd';
import rawData from './data/1.json';
import Breadcrumb from './components/Breadcrumb.jsx';
import OrgList from './components/OrgList.jsx';
import SearchBar from './components/SearchBar.jsx';
import SelectedPanel from './components/SelectedPanel.jsx';
import { buildDeptPath, buildDeptUsersMap, normalizeOrgData, searchInDept } from './utils/orgData.js';
import './styles.css';

const INITIAL_PAGE_SIZE = 18;

interface User { id: string; name: string; title?: string; avatar?: string; }
interface Dept { id: string; name: string; }

interface SelectPeopleModalProps {
  open: boolean;
  onConfirm: (result: { users: User[]; depts: Dept[] }) => void;
  onCancel: () => void;
}

export default function SelectPeopleModal({ open, onConfirm, onCancel }: SelectPeopleModalProps) {
  const [path, setPath] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<string>>(() => new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(() => new Set());
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  // 每次打开重置状态
  useEffect(() => {
    if (open) {
      setPath([]);
      setQuery('');
      setSelectedDeptIds(new Set());
      setSelectedUserIds(new Set());
      setVisibleCount(INITIAL_PAGE_SIZE);
    }
  }, [open]);

  const [dataState] = useState(() => {
    try { return normalizeOrgData(rawData); } catch (error) { return { error }; }
  });

  const data = (dataState as any)?.root ? dataState : null;
  const error = (dataState as any)?.error;

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
        {error ? (
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
