"use client";
import Loading from "@/components/Loading";
import ThemeToggle from "@/components/ThemeToggle";
import useUser from "@/hooks/useUser";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import logoMark from "../../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../../public/LogoTipo-sem-fundo.png";
import { FaMoon, FaSun } from "react-icons/fa";

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expension, setExpension] = useState("");
  const [theme, setTheme] = useState(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  // troca de tema
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // observa o scroll do aside para controlar a sombra inferior
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const checkScroll = () => {
      const hasMoreBelow = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      setShowFade(hasMoreBelow);
    };

    checkScroll();
    el.addEventListener("scroll", checkScroll);

    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <div>
      <header className="fixed inset-x-0 flex items-center justify-between p-2 m-2 my-3 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-2xl">
        <Link
          href="/docs"
          onClick={() => {
            (setIsOpen(false), setExpension(""));
          }}
        >
          <Image src={logoMark} height={50} width={180} alt="Bite Menu" className="hidden xs:block" />
          <Image src={logoTip} height={50} width={50} alt="Bite Menu" className="block xs:hidden" />
        </Link>
        <div className="flex">
          <Link className="cta-button small" href="https://www.bitemenu.com.br">
            Criar cardápio!
          </Link>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <div className="lg:hidden block">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden relative w-6 h-6 m-2 flex flex-col justify-between items-center group z-50 cursor-pointer"
            >
              <span
                className={`h-[4px] w-8 bg-[var(--foreground)] rounded transition-all duration-300 ${
                  isOpen ? "rotate-45 translate-y-[10px]" : ""
                }`}
              ></span>
              <span
                className={`h-[4px] w-8 bg-[var(--foreground)] rounded transition-all duration-300 ${isOpen ? "opacity-0" : ""}`}
              ></span>
              <span
                className={`h-[4px] w-8 bg-[var(--foreground)] rounded transition-all duration-300 ${
                  isOpen ? "-rotate-45 -translate-y-[10px]" : ""
                }`}
              ></span>
            </button>
          </div>
        </div>
      </header>
      <aside
        className={`fixed top-22 right-2 lg:left-2 w-60 h-[calc(100vh-100px)] z-10
  ${isOpen ? "translate-x-0" : "translate-x-[110%]"} lg:translate-x-0 transition`}
      >
        <div className="relative w-full h-full">
          <nav
            ref={navRef}
            className="flex flex-col w-full h-full bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-2xl overflow-y-auto overflow-x-hidden scrollbar-none"
          >
            <button
              className="flex gap-2 w-full justify-center cursor-pointer p-3 transition-colors hover-bg-translucid lg:hidden color-gray border-b-2 border-translucid"
              onClick={toggleTheme}
            >
              Alterar tema{theme === "dark" ? <FaSun size={20} /> : <FaMoon size={20} />}
            </button>
            <Link
              className="w-full p-3 hover-bg-translucid transition-colors"
              onClick={() => {
                (setIsOpen(false), setExpension("como-comecar"));
              }}
              href="/docs/como-comecar"
            >
              Como começar
            </Link>
            {expension === "como-comecar" && (
              <>
                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/como-comecar#criacao-de-conta"
                >
                  Criação de conta
                </Link>
                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/como-comecar#preenchimento-do-formulario"
                >
                  Preenchimento do formulário
                </Link>
                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/como-comecar#criacao-de-itens"
                >
                  Criação de itens
                </Link>
                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/como-comecar#configuracoes-basicas"
                >
                  Configurações básicas
                </Link>
              </>
            )}
            <Link
              className="w-full p-3 hover-bg-translucid transition-colors"
              onClick={() => {
                (setIsOpen(false), setExpension("plans"));
              }}
              href="/docs/planos"
            >
              Planos
            </Link>
            {expension === "plans" && (
              <>
                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/planos#como-funcionam-os-planos"
                >
                  Como funcionam os planos?
                </Link>

                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/planos#assinatura-de-planos"
                >
                  Assinatura de Planos
                </Link>
                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/planos#free"
                >
                  Plano Free
                </Link>

                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/planos#plus"
                >
                  Plano Plus
                </Link>
                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/planos#pro"
                >
                  Plano Pro
                </Link>
                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/planos#troca-de-plano"
                >
                  Troca de plano
                </Link>
                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/planos#cancelamento"
                >
                  Cancelamento
                </Link>

                <Link
                  className="w-full p-2 px-5 hover-bg-translucid transition-colors opacity-80 text-sm"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  href="/docs/planos#seguranca"
                >
                  Segurança
                </Link>
              </>
            )}
          </nav>
          <div
            className="pointer-events-none absolute bottom-0 left-0 w-full h-16 rounded-b-lg transition-opacity duration-200"
            style={{
              opacity: showFade ? 1 : 0,
              background: "linear-gradient(to top, var(--background), transparent)",
            }}
          />
        </div>
      </aside>
      <main className="pt-20 px-3 lg:pl-66">{children}</main>
    </div>
  );
}
