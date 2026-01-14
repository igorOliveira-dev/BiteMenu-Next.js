"use client";

import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";
import React from "react";
import { FaCheck } from "react-icons/fa";
import logoMark from "../../../public/LogoMarca-sem-fundo.png";
import { planClick } from "../utils/planClick";
import { plans } from "../../consts/Plans";
import PlansSection from "@/components/PlansSection";

const page = () => {
  return (
    <section>
      <header className="fixed top-0 inset-x-0 flex items-center justify-between p-2 m-2 my-3 bg-translucid border-2 border-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-sm">
        <Image src={logoMark} height={50} width={180} alt="Bite Menu" onClick={() => (window.location.href = "/")} />
        <ThemeToggle />
      </header>
      <div className="flex justify-center items-center pt-20">
        <PlansSection />
      </div>
    </section>
  );
};

export default page;
