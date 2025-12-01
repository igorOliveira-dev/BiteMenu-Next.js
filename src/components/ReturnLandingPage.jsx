"use client";

import React from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";

const ReturnLandingPage = () => {
  const router = useRouter();

  return (
    <div className="p-2">
      <FaChevronLeft className="cursor-pointer" onClick={() => router.push("/")} />
    </div>
  );
};

export default ReturnLandingPage;
