import React from "react";
import { FaChevronLeft } from "react-icons/fa";

const BackArrow = () => {
  return (
    <div className="p-2 cursor-pointer hover-bg-translucid flex items-center justify-center rounded-xl transition">
      <FaChevronLeft />
    </div>
  );
};

export default BackArrow;
