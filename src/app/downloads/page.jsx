"use client";

import { useEffect, useState } from "react";

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detecta se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIOS(true);
    }

    // Captura evento de instalação
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      console.log("Usuário aceitou instalar");
    } else {
      console.log("Usuário recusou");
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-3xl font-bold mb-4">Baixe o Bite Menu</h1>

      {isInstalled && <p className="text-green-600 font-semibold">O app já está instalado 🎉</p>}

      {!isInstalled && deferredPrompt && (
        <button onClick={handleInstallClick} className="bg-black text-white px-6 py-3 rounded-lg mt-4">
          Instalar App
        </button>
      )}

      {!isInstalled && !deferredPrompt && isIOS && (
        <div className="mt-4 max-w-md">
          <p>No iPhone, toque no botão de compartilhar no Safari e selecione “Adicionar à Tela de Início”.</p>
        </div>
      )}

      {!isInstalled && !deferredPrompt && !isIOS && <p className="mt-4">Seu navegador ainda não permite a instalação.</p>}
    </div>
  );
}
