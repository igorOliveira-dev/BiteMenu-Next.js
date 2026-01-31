"use client";

import React from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";

const Return = () => {
  const router = useRouter();

  return (
    <div className="p-2">
      <FaChevronLeft className="cursor-pointer hover:opacity-80 transition" onClick={() => router.back()} />
    </div>
  );
};

export default Return;
