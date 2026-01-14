"use client";
import React from "react";
import { FaCheck } from "react-icons/fa";
import { planClick } from "@/app/utils/planClick";
import { plans } from "@/consts/Plans";
import PlansSection from "@/components/PlansSection";

const page = () => {
  return (
    <div className="flex justify-center items-center pt-20">
      <PlansSection />
    </div>
  );
};

export default page;
