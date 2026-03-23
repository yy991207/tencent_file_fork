import React, { useEffect, useMemo, useRef, useState } from "react";
import Checkbox from "./Checkbox.jsx";
import HighlightedText from "./HighlightedText.jsx";

function getDeptSelectionState(dept, deptUsersMap, selectedUserIds, selectedUsersByDept, selectedDeptIds) {
  const userIds = deptUsersMap.get(dept.id) || new Set();
  let selectedCount = 0;
  userIds.forEach((id) => {
    if (selectedUserIds.has(id) || selectedUsersByDept.has(id)) {
      selectedCount += 1;
    }
  });

  const total = userIds.size;
  const isChecked = selectedDeptIds.has(dept.id) || (total > 0 && selectedCount === total);
  const isIndeterminate = !selectedDeptIds.has(dept.id) && selectedCount > 0 && selectedCount < total;

  return { isChecked, isIndeterminate };
}

export default function OrgList({
  departs,
  users,
  query,
  onNavigateDept,
  onToggleDept,
  onToggleUser,
  selectedDeptIds,
  selectedUserIds,
  selectedUsersByDept,
  deptUsersMap,
  hasMore,
  onLoadMore,
}) {
  const [shadowTop, setShadowTop] = useState(false);
  const [shadowBottom, setShadowBottom] = useState(false);
  const listRef = useRef(null);

  const handleScroll = () => {
    if (!listRef.current) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    setShadowTop(scrollTop > 4);
    setShadowBottom(scrollTop + clientHeight < scrollHeight - 4);
  };

  useEffect(() => {
    handleScroll();
  }, [departs, users]);

  const deptStates = useMemo(() => {
    const map = new Map();
    departs.forEach((dept) => {
      map.set(
        dept.id,
        getDeptSelectionState(
          dept,
          deptUsersMap,
          selectedUserIds,
          selectedUsersByDept,
          selectedDeptIds
        )
      );
    });
    return map;
  }, [departs, deptUsersMap, selectedDeptIds, selectedUserIds, selectedUsersByDept]);

  const combinedLength = departs.length + users.length;

  if (combinedLength === 0) {
    return <div className="empty">暂无可选人员或组织</div>;
  }

  return (
    <>
      <div
        className={`list-scroll${shadowTop ? " shadow-top" : ""}${shadowBottom ? " shadow-bottom" : ""}`}
        ref={listRef}
        onScroll={handleScroll}
      >
        {departs.map((dept) => {
          const state = deptStates.get(dept.id);
          return (
            <div key={dept.id} className="list-item">
              <Checkbox
                checked={state?.isChecked}
                indeterminate={state?.isIndeterminate}
                onChange={() => onToggleDept(dept)}
                ariaLabel={`选择部门${dept.name}`}
              />
              <div className="avatar" data-type="dept">
                <span className="dept-icon">◎</span>
              </div>
              <div className="item-main">
                <div className="item-title">
                  <HighlightedText text={dept.name} query={query} />
                </div>
              </div>
              <button type="button" className="navigate" onClick={() => onNavigateDept(dept)}>
                下级 ›
              </button>
            </div>
          );
        })}

        {users.map((user) => {
          const checked = selectedUserIds.has(user.id) || selectedUsersByDept.has(user.id);
          return (
            <div key={user.id} className="list-item">
              <Checkbox
                checked={checked}
                indeterminate={false}
                onChange={() => onToggleUser(user)}
                ariaLabel={`选择人员${user.name}`}
              />
              <div className="avatar" data-type="user">
                {user.name.slice(0, 1)}
              </div>
              <div className="item-main">
                <div className="item-title">
                  <HighlightedText text={user.name} query={query} />
                </div>
                {user.title ? <div className="item-meta">{user.title}</div> : null}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore ? (
        <button type="button" className="load-more" onClick={onLoadMore}>
          加载更多
        </button>
      ) : null}
    </>
  );
}
