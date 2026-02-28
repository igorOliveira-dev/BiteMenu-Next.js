"use client";

import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";
import { useEffect, useState } from "react";
import logoMark from "../../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../../public/LogoTipo-sem-fundo.png";

type InstallStatus = "checking" | "ready" | "installing" | "installed" | "unsupported";

export default function DownloadPage() {
  const [status, setStatus] = useState<InstallStatus>("checking");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore (iOS legacy)
      window.navigator.standalone === true;

    // 🔥 Se estiver rodando como app instalado, nunca mostra a tela de download
    if (isStandalone) {
      window.location.replace("/dashboard");
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setStatus("ready");
    };

    const handleInstalled = () => {
      setStatus("installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    // fallback caso não dispare evento
    const timeout = setTimeout(() => {
      setStatus((prev) => (prev === "checking" ? "unsupported" : prev));
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      clearTimeout(timeout);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;

    setStatus("installing");

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome !== "accepted") {
      setStatus("ready");
    }

    setDeferredPrompt(null);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <header className="fixed top-0 inset-x-0 flex items-center justify-between p-2 m-2 my-3 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-50 backdrop-blur-sm">
        <Image
          src={logoMark}
          height={50}
          width={180}
          alt="Bite Menu"
          onClick={() => (window.location.href = "/")}
          className="hidden xs:block"
        />
        <Image
          src={logoTip}
          height={50}
          width={50}
          alt="Bite Menu"
          onClick={() => (window.location.href = "/")}
          className="block xs:hidden"
        />
        <div className="flex">
          <ThemeToggle />
        </div>
      </header>
      <div className="max-w-md w-full text-center space-y-6 bg-low-gray p-8 rounded-lg">
        <h1 className="default-h1 font-bold">Instale o Bite Menu</h1>

        {status === "checking" && <p className="text-zinc-500 animate-pulse">Verificando compatibilidade...</p>}

        {status === "ready" && (
          <>
            <p className="color-gray">
              Tenha acesso rápido ao seu painel direto da tela inicial, como um aplicativo nativo.
            </p>
            <button
              onClick={install}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:scale-105 transition"
            >
              Instalar aplicativo
            </button>
          </>
        )}

        {status === "installing" && (
          <div className="space-y-3">
            <div className="animate-spin mx-auto w-8 h-8 border-4 border-white border-t-transparent rounded-full rounded-full" />
            <p className="color-gray">Instalando...</p>
          </div>
        )}

        {status === "installed" && (
          <div className="space-y-3">
            <p className="text-green-400 font-semibold">Instalação concluída.</p>
            <a href="/dashboard" className="inline-block py-2 px-6 rounded-xl bg-white text-black font-semibold">
              Ir para o painel
            </a>
          </div>
        )}

        {status === "unsupported" && (
          <div className="space-y-3 color-gray text-sm">
            <p>Seu navegador não oferece instalação direta ou o app já está instalado.</p>
          </div>
        )}
      </div>
    </main>
  );
}
