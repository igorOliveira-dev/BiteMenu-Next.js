import React from "react";
import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";

const notFound = () => {
  return (
    <div className="w-[100dvw] h-[100dvh] flex flex-col items-center justify-center">
      <div className="mb-4">
        <BrandLogo large />
      </div>
      <div className="flex items-center gap-4">
        <h1 className="default-h1">404</h1>
        <hr className="border h-6"></hr>
        <h2>Esta página não existe</h2>
      </div>
      <Link className="underline text-brand-red hover:opacity-80" href="/">
        Voltar à página inicial
      </Link>
    </div>
  );
};

export default notFound;
