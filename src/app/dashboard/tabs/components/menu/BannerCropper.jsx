"use client";

import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { FaDesktop, FaMobileAlt, FaImage, FaImages, FaTrash } from "react-icons/fa";
import ActionsMenu from "@/components/ActionMenu";

// Mesmas proporções de BANNER_ASPECT_CLASS (components/BannerImage.jsx)
export const BANNER_CROPS = {
  desktop: { label: "Computador", aspect: 4, maxWidth: 1640, Icon: FaDesktop },
  mobile: { label: "Celular", aspect: 2, maxWidth: 1080, Icon: FaMobileAlt },
};

const DEFAULT_VIEW = { crop: { x: 0, y: 0 }, zoom: 1 };

// Uma aba por tela. Com imagem nova (`sources[mode]`) mostra o recortador; sem, mostra o banner salvo (`saved[mode]`).
// onAreaChange(mode, areaEmPixels) | onPick(mode, file): imagem só para aquela tela
// onPickBoth(file): mesma imagem nas duas telas | onRemove(): remove o banner
export default function BannerCropper({ sources, saved, onAreaChange, onPick, onPickBoth, onRemove }) {
  const pickOneRef = useRef(null);
  const pickBothRef = useRef(null);
  const [mode, setMode] = useState("mobile");
  const [views, setViews] = useState({});

  const src = sources[mode];
  const { label, aspect } = BANNER_CROPS[mode];
  // posição/zoom guardados por tela; zeram quando a imagem daquela tela muda
  const view = views[mode]?.src === src ? views[mode] : DEFAULT_VIEW;
  const setView = (patch) =>
    setViews((v) => ({
      ...v,
      [mode]: { ...(v[mode]?.src === src ? v[mode] : DEFAULT_VIEW), src, ...patch },
    }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        {Object.entries(BANNER_CROPS).map(([key, { label, Icon }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border-2 transition ${
              mode === key ? "border-blue-600 bg-blue-600/10" : "border-[var(--low-gray)] opacity-70 hover:opacity-100"
            }`}
          >
            <Icon /> {label}
          </button>
        ))}
        <ActionsMenu
          buttonClassName="py-3"
          options={[
            { label: `Usar outra imagem só no ${label.toLowerCase()}`, icon: <FaImage />, onClick: () => pickOneRef.current?.click() },
            { label: "Trocar imagem nas duas telas", icon: <FaImages />, onClick: () => pickBothRef.current?.click() },
            { label: "Remover banner", icon: <FaTrash />, onClick: onRemove, danger: true },
          ]}
        />
      </div>

      {src ? (
        <>
          <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden bg-black">
            {/* key força remontagem ao trocar de tela/imagem, para recalcular a área de recorte */}
            <Cropper
              key={`${mode}-${src}`}
              image={src}
              aspect={aspect}
              crop={view.crop}
              zoom={view.zoom}
              maxZoom={5}
              objectFit="cover"
              // o preflight do Tailwind põe max-width:100% em <img>, o que encolhe a imagem e deixa
              // o recorte "sair" dela; sem isso o restrictPosition (padrão) segura o recorte dentro
              classes={{ mediaClassName: "max-w-none" }}
              showGrid
              onCropChange={(crop) => setView({ crop })}
              onZoomChange={(zoom) => setView({ zoom })}
              onCropComplete={(_, px) => onAreaChange(mode, px)}
            />
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={0.01}
            value={view.zoom}
            onChange={(e) => setView({ zoom: Number(e.target.value) })}
            aria-label="Zoom"
            className="w-full accent-blue-600"
          />
          <p className="text-xs color-gray text-center">
            Arraste e use o zoom para ajustar. Confira as duas abas: celular e computador.
          </p>
        </>
      ) : (
        // banner já salvo: exatamente como aparece nessa tela
        <div className="flex justify-center rounded-lg bg-black/80 p-3">
          <img
            src={saved[mode]}
            alt={`Banner no ${label.toLowerCase()}`}
            style={{ aspectRatio: aspect }}
            className={`object-cover w-full rounded ${mode === "mobile" ? "max-w-[300px]" : ""}`}
          />
        </div>
      )}

      {/* inputs acionados pelo menu de opções */}
      <input
        ref={pickOneRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onPick(mode, e.target.files[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={pickBothRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onPickBoth(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
