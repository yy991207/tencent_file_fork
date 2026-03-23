import React from "react";

export default function Breadcrumb({ path, onReset }) {
  const isRoot = path.length === 0;

  return (
    <div className="breadcrumb">
      {isRoot ? (
        <span className="breadcrumb-root">联系人</span>
      ) : (
        <button type="button" className="breadcrumb-link" onClick={onReset}>
          联系人
        </button>
      )}
      {path.map((dept) => (
        <span key={dept.id} className="breadcrumb-item">
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-current">{dept.name}</span>
        </span>
      ))}
    </div>
  );
}
