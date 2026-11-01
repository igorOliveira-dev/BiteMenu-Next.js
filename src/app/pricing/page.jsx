"use client";

import ThemeToggle from "@/components/ThemeToggle";
import React from "react";
import { FaCheck } from "react-icons/fa";
import BrandLogo from "@/components/BrandLogo";
import { plans } from "../../consts/Plans";
import PlansSection from "@/components/PlansSection";

const page = () => {
  return (
    <section>
      <header className="fixed top-0 inset-x-0 flex items-center justify-between m-2 my-3 bg-brand-surface/85 border border-brand-line rounded-full pl-4 pr-1.5 py-1.5 z-10 backdrop-blur-2xl">
        <BrandLogo />
        <ThemeToggle />
      </header>
      <div className="flex justify-center items-center pt-20">
        <PlansSection />
      </div>
    </section>
  );
};

export default page;
