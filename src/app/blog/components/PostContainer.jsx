"use client";

import Image from "next/image";
import React from "react";
import logoMark from "../../../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../../../public/LogoTipo-sem-fundo.png";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import BlogSection from "../BlogSection";

const PostContainer = ({ title, date, mainImageUrl, children }) => {
  return (
    <div className="flex flex-col items-center">
      <header className="fixed inset-x-0 flex items-center justify-between p-2 m-2 my-3 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-sm">
        <Image
          src={logoMark}
          height={50}
          width={180}
          alt="Bite Menu"
          onClick={() => (window.location.href = "https://www.bitemenu.com.br/")}
          className="hidden xs:block"
        />
        <Image
          src={logoTip}
          height={50}
          width={50}
          alt="Bite Menu"
          onClick={() => (window.location.href = "https://www.bitemenu.com.br/")}
          className="block xs:hidden"
        />
        <div className="flex">
          <Link className="cta-button small" href="https://www.bitemenu.com.br">
            Criar cardápio!
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="p-4 pt-24 max-w-6xl">
        <header className="mb-8">
          <h1 className="default-h1">{title}</h1>
          <p className="text-[var(--gray)]">{date}</p>
          <Image height={318} width={566} src={mainImageUrl} alt={title} className="mt-4 rounded-lg" />
        </header>
        {children}
      </main>
      <div className="mt-6 py-6 px-4 bg-translucid w-full">
        <BlogSection />
      </div>
    </div>
  );
};

export default PostContainer;
