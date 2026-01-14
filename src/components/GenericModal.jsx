import React from "react";

const GenericModal = ({ children, onClose, bgColor, maxWidth, margin, wfull }) => {
  return (
    <div className="fixed inset-0 bg-dark-gray-90 backdrop-blur-sm flex items-center justify-center z-150" onClick={onClose}>
      <div
        className={`rounded-xl shadow-xl p-3 sm:p-6 min-w-70 mx-2 sm:mx-4 ${wfull ? "w-full" : ""}`}
        style={{
          backgroundColor: bgColor ? bgColor : "var(--low-gray)",
          maxWidth: maxWidth ? maxWidth : null,
          margin: margin ? margin : null,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default GenericModal;
