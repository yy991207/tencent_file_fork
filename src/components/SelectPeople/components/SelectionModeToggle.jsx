import React from "react";

export default function SelectionModeToggle({ value, onChange }) {
  return (
    <div className="mode-toggle" role="group" aria-label="选择模式">
      <button
        type="button"
        className={value === "multi" ? "active" : ""}
        onClick={() => onChange("multi")}
      >
        多选
      </button>
      <button
        type="button"
        className={value === "single" ? "active" : ""}
        onClick={() => onChange("single")}
      >
        单选
      </button>
    </div>
  );
}
