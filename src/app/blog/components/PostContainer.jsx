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
    <>
      <header className="fixed inset-x-0 flex items-center justify-between p-2 m-2 my-3 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-sm">
        <Image
          src={logoMark}
          height={50}
          width={180}
          alt="Bite Menu"
          onClick={() => (window.location.href = "/#blog")}
          className="hidden xs:block"
        />
        <Image
          src={logoTip}
          height={50}
          width={50}
          alt="Bite Menu"
          onClick={() => (window.location.href = "/#blog")}
          className="block xs:hidden"
        />
        <div className="flex">
          <Link className="cta-button small" href="register">
            Criar cardápio!
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="p-4 pt-24">
        <header className="mb-8">
          <h1 className="default-h1">{title}</h1>
          <p className="text-[var(--gray)]">{date}</p>
          <Image height={162} width={288} src={mainImageUrl} alt={title} className="mt-4 rounded-lg" />
        </header>
        {children}
        <BlogSection />
      </main>
    </>
  );
};

export default PostContainer;
