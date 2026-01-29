import React from "react";
import XButton from "./XButton";

const GenericModal = ({
  children,
  onClose,
  bgColor,
  maxWidth,
  margin,
  wfull,
  zIndex,
  py,
  title,
  titleColor,
  hoverXButtonColor,
}) => {
  return (
    <div className="fixed inset-0 bg-dark-gray-90 backdrop-blur-sm flex items-center justify-center z-150" onClick={onClose}>
      <div
        className={`rounded-xl shadow-xl p-3 sm:p-6 min-w-70 mx-2 sm:mx-4 ${wfull ? "w-full" : ""}`}
        style={{
          backgroundColor: bgColor ? bgColor : "var(--low-gray)",
          maxWidth: maxWidth ? maxWidth : null,
          margin: margin ? margin : null,
          zIndex: zIndex ? zIndex : 150,
          paddingBlock: py ? py : null,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div onClick={onClose} className="flex items-center justify-between mb-4" style={{ color: titleColor }}>
          <h3 className="font-semibold">{title}</h3>
          <XButton ariaLabel="Fechar" hoverColor={hoverXButtonColor} />
        </div>
        {children}
      </div>
    </div>
  );
};

export default GenericModal;
