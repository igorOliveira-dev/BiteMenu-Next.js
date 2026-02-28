"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import logoMark from "../../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../../public/LogoTipo-sem-fundo.png";

type InstallStatus = "checking" | "ready" | "installing" | "installed" | "unsupported";

/**
 * Regra importante: checar sincronamente se já estamos em "standalone"
 * antes de qualquer render. Isso evita o flash de UI "Instalando..."
 * dentro da janela do app que o Chrome cria na instalação.
 */
export default function DownloadPage() {
  // Checagem síncrona IMEDIATA (executa antes do React montar efeitos)
  if (typeof window !== "undefined") {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore: legacy iOS check
      window.navigator.standalone === true;

    // Se já estiver rodando como app standalone, redireciona imediatamente
    // para o dashboard e não renderiza nada desta página.
    if (isStandalone) {
      // Use replace para não poluir o histórico
      window.location.replace("/dashboard");
      return null;
    }
  }

  // --- resto do componente (executado só quando NÃO estamos em standalone) ---
  const [status, setStatus] = useState<InstallStatus>("checking");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Se estamos aqui, já sabemos sincronamente que NÃO estamos em standalone.
    // Agora podemos ouvir o evento `beforeinstallprompt`.
    const handleBeforeInstallPrompt = (e: any) => {
      // evita o mini banner instantâneo do navegador
      e.preventDefault();
      setDeferredPrompt(e);
      setStatus("ready");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // fallback caso o evento não venha
    const timeout = setTimeout(() => {
      setStatus((prev) => (prev === "checking" ? "unsupported" : prev));
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(timeout);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    try {
      setStatus("installing");
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      // Se o usuário recusou, volta ao estado pronto
      if (outcome !== "accepted") {
        setStatus("ready");
      } else {
        // Aceitou: o navegador pode abrir o app imediatamente.
        // Não tentamos manipular isso — a aba original pode perder foco/ser fechada.
        // Mantemos o estado "installing" por breve tempo (UX), depois atualizamos.
        setTimeout(() => {
          setStatus("installed");
        }, 1200);
      }
    } catch (err) {
      // falha inesperada
      console.error("install error", err);
      setStatus("ready");
    } finally {
      setDeferredPrompt(null);
    }
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
            <p className="color-gray">Tenha acesso rápido ao seu painel direto da tela inicial.</p>
            <button
              onClick={install}
              className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:opacity-80 transition cursor-pointer"
            >
              Instalar aplicativo
            </button>
          </>
        )}

        {status === "installing" && (
          <div className="space-y-3">
            <div className="animate-spin mx-auto w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
            <p className="color-gray">Instalando...</p>
          </div>
        )}

        {status === "installed" && (
          <div className="space-y-3">
            <p className="text-green-400 font-semibold">Instalação concluída.</p>
            <p className="text-zinc-400 text-sm">Abra o Bite Menu pelo ícone na sua tela inicial para acessar o painel.</p>
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
