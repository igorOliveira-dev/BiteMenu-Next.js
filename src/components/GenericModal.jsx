import React from "react";

const GenericModal = ({ children, onClose, bgColor }) => {
  return (
    <div className="fixed inset-0 bg-dark-gray-90 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded-xl shadow-xl p-6 min-w-80"
        style={{ backgroundColor: bgColor ? bgColor : "var(--low-gray)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default GenericModal;
