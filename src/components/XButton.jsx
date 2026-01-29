import React from "react";

const XButton = ({ ariaLabel, disabled, hoverColor }) => {
  return (
    <button
      className="rounded-lg px-2 py-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--x-hover)]"
      style={{ "--x-hover": hoverColor ?? "var(--translucid)" }}
      aria-label={ariaLabel || undefined}
      disabled={disabled}
    >
      ✕
    </button>
  );
};

export default XButton;
