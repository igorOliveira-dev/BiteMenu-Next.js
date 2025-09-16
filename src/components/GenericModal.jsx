import React from "react";

const GenericModal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-dark-gray-90 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-low-gray rounded-xl shadow-xl p-6 w-80" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default GenericModal;
