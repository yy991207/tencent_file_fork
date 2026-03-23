import React from "react";

export default function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="search">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索用户、部门或组织"
      />
      {value ? (
        <button type="button" className="search-clear" onClick={onClear}>
          ×
        </button>
      ) : null}
    </div>
  );
}
