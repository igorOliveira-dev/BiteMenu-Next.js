import React from "react";

const XButton = (ariaLabel, disabled) => {
  return (
    <button
      className="rounded-lg px-2 py-1 hover:bg-[var(--translucid)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label={ariaLabel ? ariaLabel : null}
      disabled={disabled ? disabled : false}
    >
      ✕
    </button>
  );
};

export default XButton;
