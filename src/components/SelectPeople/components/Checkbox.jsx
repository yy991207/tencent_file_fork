import React, { useEffect, useRef } from "react";

export default function Checkbox({ checked, indeterminate, onChange, ariaLabel }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  );
}
