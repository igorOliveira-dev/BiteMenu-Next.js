"use client";

import React, { useMemo, useRef } from "react";
import QRCode from "react-qr-code";
import GenericModal from "@/components/GenericModal";
import { FaRegCopy, FaExternalLinkAlt, FaDownload, FaChevronLeft } from "react-icons/fa";

export default function QrCodeModal({
  isOpen,
  onClose,
  url,
  filename = "qrcode",
  onToast, // (msg, type) => void  // type: "success" | "error"
  zIndex = 180,
}) {
  const qrRef = useRef(null);

  const canShow = useMemo(() => Boolean(url), [url]);

  const toast = (msg, type = "success") => {
    if (onToast) onToast(msg, type);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copiado!", "success");
    } catch {
      toast("Erro ao copiar link", "error");
    }
  };

  const open = () => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadPng = () => {
    try {
      if (!qrRef.current) return toast("QR não encontrado", "error");

      const svg = qrRef.current.querySelector("svg");
      if (!svg) return toast("SVG do QR não encontrado", "error");

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);

      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const size = 1024; // alta qualidade
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(svgUrl);
          return toast("Canvas não suportado", "error");
        }

        // Fundo branco (pra não ficar transparente)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);

        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(svgUrl);

        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${filename}.png`;
        a.click();

        toast("QR Code baixado!", "success");
      };

      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        toast("Erro ao gerar imagem do QR", "error");
      };

      img.src = svgUrl;
    } catch {
      toast("Erro ao baixar o QR Code", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <GenericModal zIndex={zIndex} onClose={onClose} wfull maxWidth={"420px"} py={"24px"}>
      <div className="flex items-center gap-2 mb-4">
        <div className="cursor-pointer p-2" onClick={onClose}>
          <FaChevronLeft />
        </div>
        <h3 className="font-bold text-center">QR Code do seu cardápio</h3>
      </div>

      {!canShow ? (
        <p className="text-sm opacity-80">Carregando link do cardápio…</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div ref={qrRef} className="bg-white p-3 rounded-xl border-2 border-[var(--translucid)]">
            <QRCode value={url} size={200} />
          </div>

          <p className="text-xs opacity-80 break-all text-center px-2">{url}</p>

          <div className="grid grid-cols-1 xxs:grid-cols-3 gap-2 w-full mt-2">
            <button
              onClick={copy}
              className="cursor-pointer p-2 bg-blue-600/80 text-white font-semibold rounded-lg hover:bg-blue-700/80 border-2 border-[var(--translucid)] transition flex items-center justify-center gap-2"
            >
              <FaRegCopy /> Copiar
            </button>

            <button
              onClick={open}
              className="cursor-pointer p-2 bg-green-600/80 text-white font-semibold rounded-lg hover:bg-green-700/80 border-2 border-[var(--translucid)] transition flex items-center justify-center gap-2"
            >
              <FaExternalLinkAlt /> Abrir
            </button>

            <button
              onClick={downloadPng}
              className="cursor-pointer p-2 bg-zinc-800/80 text-white font-semibold rounded-lg hover:bg-zinc-900/80 border-2 border-[var(--translucid)] transition flex items-center justify-center gap-2"
            >
              <FaDownload /> Baixar
            </button>
          </div>
        </div>
      )}
    </GenericModal>
  );
}
