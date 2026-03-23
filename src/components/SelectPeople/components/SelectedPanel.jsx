import React from "react";

export default function SelectedPanel({ selectedUsers, selectedDepts, onRemoveUser, onRemoveDept }) {
  const count = selectedUsers.length + selectedDepts.length;

  return (
    <div className="panel selected-panel">
      <div className="panel-header">
        <div className="panel-title">已选：{count} 个</div>
      </div>
      <div className="panel-body">
        {count === 0 ? (
          <div className="empty">暂无已选人员或组织</div>
        ) : (
          <div className="selected-list">
            {selectedUsers.map((user) => (
              <div key={user.id} className="selected-item">
                <div className="avatar" data-type="user">
                  {user.name.slice(0, 1)}
                </div>
                <div className="selected-info">
                  <div className="selected-name">{user.name}</div>
                  {user.title ? <div className="selected-meta">{user.title}</div> : null}
                </div>
                <button
                  type="button"
                  className="remove"
                  onClick={() => onRemoveUser(user)}
                >
                  ×
                </button>
              </div>
            ))}
            {selectedDepts.map((dept) => (
              <div key={dept.id} className="selected-item">
                <div className="avatar" data-type="dept">
                  <span className="dept-icon">◎</span>
                </div>
                <div className="selected-info">
                  <div className="selected-name">{dept.name}</div>
                  <div className="selected-meta">组织</div>
                </div>
                <button
                  type="button"
                  className="remove"
                  onClick={() => onRemoveDept(dept)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
