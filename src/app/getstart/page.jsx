"use client";

import Loading from "@/components/Loading";
import { useConfirm } from "@/providers/ConfirmProvider";
import React, { useState } from "react";
import { FaShoppingCart } from "react-icons/fa";

const COLOR_PALETTES = [
  { bg: "#F8F9FA", title: "#007BFF", details: "#28A745" }, // Moderno Clean
  { bg: "#FFF8E1", title: "#FF6F00", details: "#D84315" }, // Sunrise
  { bg: "#E8F5E9", title: "#2E7D32", details: "#1B5E20" }, // Floresta
  { bg: "#F3E5F5", title: "#6A1B9A", details: "#4A148C" }, // Pôr do Sol
  { bg: "#E3F2FD", title: "#0D47A1", details: "#1976D2" }, // Oceano
  { bg: "#FEF3C7", title: "#F59E0B", details: "#D97706" }, // Dourado Suave
  { bg: "#ECFDF5", title: "#059669", details: "#047857" }, // Menta
  { bg: "#FDF2F8", title: "#DB2777", details: "#9D174D" }, // Floral
  { bg: "#EFF6FF", title: "#1E3A8A", details: "#3B82F6" }, // Azul Profundo
  { bg: "#FFF1F2", title: "#B91C1C", details: "#991B1B" }, // Rosé
  { bg: "#FCFCFD", title: "#111827", details: "#6B7280" }, // Neutro Elegante
  { bg: "#F0FDF4", title: "#166534", details: "#15803D" }, // Verde Vivo
  { bg: "#FEFCE8", title: "#92400E", details: "#78350F" }, // Terracota
  { bg: "#F3F4F6", title: "#374151", details: "#4B5563" }, // Cinza Profundo
  { bg: "#FFFBEB", title: "#B45309", details: "#92400E" }, // Mel
  { bg: "#ECFEFF", title: "#0E7490", details: "#155E75" }, // Água Marinha
  { bg: "#FFF7ED", title: "#C2410C", details: "#9A3412" }, // Tijolo
  { bg: "#F9FAFB", title: "#7F1D1D", details: "#991B1B" }, // Vinho
  { bg: "#EFFAFD", title: "#0369A1", details: "#075985" }, // Céu Claro
  { bg: "#FDF4FF", title: "#6B21A8", details: "#581C87" }, // Ameixa
  { bg: "#121212", title: "#BB86FC", details: "#03DAC6" }, // Noite Estrelada
  { bg: "#1E1E1E", title: "#FF6E40", details: "#FFAB40" }, // Chama Quente
  { bg: "#2D2D2D", title: "#82B1FF", details: "#448AFF" }, // Gelo Azul
  { bg: "#242424", title: "#FF4081", details: "#F50057" }, // Rosa Neon
  { bg: "#1B1B2F", title: "#E94560", details: "#0F3460" }, // Pôr‑do‑Sol Noturno
  { bg: "#0D0D0D", title: "#C62828", details: "#FF5252" }, // Rubi Escuro
  { bg: "#181818", title: "#00E676", details: "#64DD17" }, // Lima Neon
  { bg: "#20232A", title: "#61DAFB", details: "#21A1F1" }, // React Dark
  { bg: "#282C34", title: "#61DAFB", details: "#98C379" }, // Código VS
  { bg: "#1C1C1E", title: "#FF9500", details: "#FFCC00" }, // Cinza Espacial
  { bg: "#0F0E13", title: "#FFD600", details: "#FFEA00" }, // Ouro Noturno
  { bg: "#263238", title: "#80DEEA", details: "#26C6DA" }, // Oceano Profundo
  { bg: "#1A237E", title: "#C5CAE9", details: "#7986CB" }, // Noite Azul
  { bg: "#311B92", title: "#E1BEE7", details: "#BA68C8" }, // Lavanda Escuro
  { bg: "#1B262C", title: "#BBDEFB", details: "#90CAF9" }, // Lago Montenegro
  { bg: "#232323", title: "#FFD740", details: "#FFC400" }, // Mostarda
  { bg: "#272727", title: "#FF4081", details: "#F50057" }, // Pink Urbano
  { bg: "#1C1C1C", title: "#00BFA5", details: "#1DE9B6" }, // Água‑Marinha
  { bg: "#0E0E10", title: "#7C4DFF", details: "#651FFF" }, // Ultravioleta
  { bg: "#161616", title: "#FFEB3B", details: "#FDD835" }, // Amarelo Neon
];

// valores iniciais (primeira paleta)
const DEFAULT_BACKGROUND = COLOR_PALETTES[0].bg;
const DEFAULT_TITLE = COLOR_PALETTES[0].title;
const DEFAULT_DETAILS = COLOR_PALETTES[0].details;

const serviceOptions = [
  { id: "delivery", label: "Entrega" },
  { id: "pickup", label: "Retirada" },
  { id: "dinein", label: "Comer no local" },
  { id: "takeaway", label: "Para viagem" },
  { id: "driveThru", label: "Drive-thru" },
];

export default function GetStart() {
  // estados gerais
  const [establishmentName, setEstablishmentName] = useState("");
  const [selectedServices, setSelectedServices] = useState(["delivery", "pickup", "dinein"]);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [menuFile, setMenuFile] = useState(null);
  const [creatingMenu, setCreatingMenu] = useState(false);
  const confirm = useConfirm();

  // índice da paleta atual
  const [paletteIndex, setPaletteIndex] = useState(0);

  // estados de cor já iniciados com valores da paleta
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [titleColor, setTitleColor] = useState(DEFAULT_TITLE);
  const [detailsColor, setDetailsColor] = useState(DEFAULT_DETAILS);

  // alterna checkbox de serviços
  const toggleService = (id) =>
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  // handlers de upload
  const handleLogoChange = (e) => setLogoFile(e.target.files[0]);
  const handleBannerChange = (e) => setBannerFile(e.target.files[0]);
  const handleMenuChange = (e) => setMenuFile(e.target.files[0]);

  // reset pro default da paleta atual
  const clearColor = (setter, defaultValue) => setter(defaultValue);

  // sugere uma paleta aleatória diferente da atual
  const suggestRandomPalette = () => {
    let next = Math.floor(Math.random() * COLOR_PALETTES.length);
    while (next === paletteIndex) {
      next = Math.floor(Math.random() * COLOR_PALETTES.length);
    }
    setPaletteIndex(next);
    const { bg, title, details } = COLOR_PALETTES[next];
    setBackgroundColor(bg);
    setTitleColor(title);
    setDetailsColor(details);
  };

  // configuração dos campos de cor
  const colorFields = [
    {
      label: "Cor do fundo:",
      value: backgroundColor,
      setter: setBackgroundColor,
      defaultValue: DEFAULT_BACKGROUND,
    },
    {
      label: "Cor do título:",
      value: titleColor,
      setter: setTitleColor,
      defaultValue: DEFAULT_TITLE,
    },
    {
      label: "Cor dos detalhes:",
      value: detailsColor,
      setter: setDetailsColor,
      defaultValue: DEFAULT_DETAILS,
    },
  ];

  // ícone de limpar/reset
  const noneIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block h-5 w-5 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  // calcula cor de texto (black/white) com base no YIQ
  function getContrastTextColor(hex) {
    const cleanHex = (hex || DEFAULT_BACKGROUND).replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
  }

  // envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    const ok = await confirm("Quer mesmo criar o cardápio com essas informações?");
    if (!ok) return;

    setCreatingMenu(true);

    console.log({
      establishmentName,
      selectedServices,
      logoFile,
      bannerFile,
      menuFile,
      backgroundColor,
      titleColor,
      detailsColor,
    });
    // chamada de API ou próxima etapa...
  };

  if (creatingMenu) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <Loading />
        <p className="my-2">Estamos criando seu cardápio</p>
        <p className="text-sm color-gray">Em menos de um minuto estará pronto.</p>
      </div>
    );
  }

  return (
    <form className="flex flex-col items-center p-4" onSubmit={handleSubmit}>
      {/* Container do form */}
      <div className="max-w-[700px] w-full rounded-lg mt-6 p-6 space-y-6 bg-translucid shadow-[0_0_40px_var(--shadow)]">
        {/* Cabeçalho */}
        <div className="max-w-[700px] text-center">
          <h1 className="text-3xl font-bold mb-2">Bora montar seu cardápio digital?</h1>
          <h3>Responda rapidinho aqui embaixo pra gente deixar tudo do seu jeito.</h3>
          <p className="color-gray">Fica tranquilo: nenhuma pergunta é obrigatória e você pode mudar tudo depois.</p>
        </div>
        {/* 1. Nome */}
        <div>
          <label className="block font-semibold mb-2">1. Como seu negócio se chama?</label>
          <input
            type="text"
            value={establishmentName}
            onChange={(e) => setEstablishmentName(e.target.value)}
            placeholder="Nome do seu estabelecimento"
            className="w-full px-3 py-2 bg-translucid border border-[var(--low-gray)] rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* 2. Serviços */}
        <div>
          <p className="font-semibold mb-2">2. O que você oferece pro cliente? (Pode marcar mais de uma)</p>
          <div className="grid grid-cols-2 gap-4">
            {serviceOptions.map((opt) => (
              <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.id}
                  checked={selectedServices.includes(opt.id)}
                  onChange={() => toggleService(opt.id)}
                  className="peer appearance-none w-6 h-6 border-2 rounded-md transition-all duration-150 flex items-center justify-center relative"
                  style={{
                    borderColor: "#155dfc",
                    backgroundColor: selectedServices.includes(opt.id) ? "#155dfc" : "transparent",
                  }}
                />

                <span
                  className="relative after:content-['✓'] after:absolute after:text-white after:text-sm after:font-bold after:top-[3px] after:left-[-25px] peer-checked:after:opacity-100 after:opacity-0 transition-opacity duration-150"
                  style={{
                    color: "var(--gray)",
                  }}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Logo do estabelecimento */}
        <div className="mb-4">
          <p className="font-semibold mb-2">3. Tem uma logo ou imagem que represente seu negócio? (ideal quadrada)</p>
          <label className="text-center flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-[var(--gray)] rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
            {logoFile ? (
              <img src={URL.createObjectURL(logoFile)} alt="Preview da logo" className="object-contain w-full h-full" />
            ) : (
              <span className="color-gray">Clique aqui para inserir sua logo (1:1)</span>
            )}
            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
          </label>
          {logoFile && (
            <button type="button" onClick={() => setLogoFile(null)} className="mt-1 text-sm text-red-500 hover:underline">
              Remover logo
            </button>
          )}
        </div>

        {/* 4. Banner do estabelecimento */}
        <div className="mb-4">
          <p className="font-semibold mb-2">4. Tem uma imagem grande pro banner? (1640×664)</p>
          <label className="text-center flex flex-col items-center justify-center w-full h-30 border-2 border-dashed border-[var(--gray)] rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
            {bannerFile ? (
              <img src={URL.createObjectURL(bannerFile)} alt="Preview do banner" className="object-cover w-full h-full" />
            ) : (
              <span className="color-gray">Clique aqui para inserir seu banner (1640×664)</span>
            )}
            <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          </label>
          {bannerFile && (
            <button type="button" onClick={() => setBannerFile(null)} className="mt-1 text-sm text-red-500 hover:underline">
              Remover banner
            </button>
          )}
        </div>

        {/* 5. Cardápio estático/físico */}
        <div className="mb-4">
          <p className="font-semibold mb-2">
            5. Tem um cardápio pronto em foto ou PDF? (caso não tenha, você pode cadastrar seus produtos manualmente depois)
          </p>
          <label className="text-center flex flex-col items-center justify-center w-36 h-52 border-2 border-dashed border-[var(--gray)] rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
            {menuFile && menuFile.type.startsWith("image/") ? (
              <img src={URL.createObjectURL(menuFile)} alt="Preview do cardápio" className="object-contain w-full h-full" />
            ) : menuFile && menuFile.type === "application/pdf" ? (
              <embed src={URL.createObjectURL(menuFile)} type="application/pdf" className="w-full h-full" />
            ) : (
              <span className="color-gray px-4">Clique aqui para inserir seu cardápio</span>
            )}
            <input type="file" accept="image/*,.pdf" onChange={handleMenuChange} className="hidden" />
          </label>
          {menuFile && (
            <button type="button" onClick={() => setMenuFile(null)} className="mt-1 text-sm text-red-500 hover:underline">
              Remover cardápio
            </button>
          )}
        </div>

        {/* 6. Seletores de cor */}
        <div>
          <p className="font-semibold mb-2">
            6. Escolha as cores do seu cardápio! (Clique em <span className="inline-block align-middle">{noneIcon}</span>{" "}
            para resetar)
          </p>
          <div className="flex flex-col space-y-4">
            {colorFields.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <label className="w-32">{item.label}</label>
                <input type="color" value={item.value} onChange={(e) => item.setter(e.target.value)} className="h-8 w-8 " />
                <button
                  type="button"
                  onClick={() => clearColor(item.setter, item.defaultValue)}
                  className="flex items-center justify-center h-8 w-8 border border-low-gray rounded hover-bg-translucid transition"
                  title="Resetar para o padrão"
                >
                  {noneIcon}
                </button>
              </div>
            ))}
          </div>

          {/* Botão de sugerir paleta aleatória */}
          <div className="mt-4 flex justify-begin">
            <button
              type="button"
              onClick={suggestRandomPalette}
              className="px-6 py-4 rounded-lg gray-button text-sm font-medium transition"
            >
              💡 Sugerir cores
            </button>
          </div>
        </div>

        {/* Preview ao vivo */}
        <div className="mt-6">
          <p className="font-semibold mb-2">
            Este é uma prévia rápida — ainda não é o cardápio final. Aqui você confere se cores, logos e imagens estão
            harmonizados antes de seguir adiante:
          </p>

          <div
            className="rounded-lg shadow-inner overflow-hidden transition-colors duration-500 ease-in-out"
            style={{ backgroundColor }}
          >
            {/* Banner */}
            <div
              className="w-full h-32 flex items-center justify-center transition-colors duration-500 ease-in-out"
              style={{
                backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff30" : "#00000030",
              }}
            >
              {bannerFile ? (
                <img
                  src={URL.createObjectURL(bannerFile)}
                  alt="Banner do estabelecimento"
                  className="object-cover w-full h-full"
                />
              ) : (
                <span
                  className="transition-colors duration-500 ease-in-out"
                  style={{
                    color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#555",
                  }}
                >
                  Banner (1640×664)
                </span>
              )}
            </div>

            {/* Conteúdo interno */}
            <div className="p-4">
              {/* Logo e Nome */}
              <div className="flex items-center mb-4">
                <div
                  className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center transition-colors duration-500 ease-in-out"
                  style={{
                    backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff30" : "#00000030",
                  }}
                >
                  {logoFile ? (
                    <img
                      src={URL.createObjectURL(logoFile)}
                      alt="Logo do estabelecimento"
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <span
                      className="text-xs transition-colors duration-500 ease-in-out"
                      style={{
                        color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#555",
                      }}
                    >
                      Logo
                    </span>
                  )}
                </div>
                <h2
                  className="ml-3 text-2xl font-bold transition-colors duration-500 ease-in-out"
                  style={{ color: titleColor }}
                >
                  {establishmentName || "Meu Estabelecimento"}
                </h2>
              </div>

              {/* Pratos de exemplo */}
              <h3
                className="font-bold mb-2 transition-colors duration-500 ease-in-out"
                style={{ color: getContrastTextColor(backgroundColor) }}
              >
                Lanches:
              </h3>

              {[
                {
                  name: "X-Burger Tradicional",
                  desc: "Pão, hambúrguer, queijo, alface, tomate e maionese especial.",
                  price: "20,00",
                },
                {
                  name: "Misto Quente Gourmet",
                  desc: "Pão artesanal, presunto fatiado, queijo muçarela e toque de manteiga.",
                  price: "20,00",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="mb-4 flex items-center p-4 rounded-lg transition-colors duration-500 ease-in-out"
                  style={{
                    backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff20" : "#00000020",
                  }}
                >
                  <div className="w-full">
                    <h3
                      className="text-xl font-semibold transition-colors duration-500 ease-in-out"
                      style={{ color: getContrastTextColor(backgroundColor) }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="text-sm mb-2 transition-colors duration-500 ease-in-out"
                      style={{ color: getContrastTextColor(backgroundColor) }}
                    >
                      {item.desc}
                    </p>
                    <div className="flex justify-between w-full">
                      <p
                        className="text-2xl font-semibold transition-colors duration-500 ease-in-out"
                        style={{ color: getContrastTextColor(backgroundColor) }}
                      >
                        R${item.price}
                      </p>

                      {/* Botão Adicionar ao carrinho */}
                      <button
                        className="rounded-md h-8 w-16 flex items-center justify-center transition-colors duration-500 ease-in-out"
                        style={{
                          backgroundColor: detailsColor,
                          color: getContrastTextColor(detailsColor),
                        }}
                      >
                        <FaShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botão final */}
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Criar meu cardápio!
        </button>
      </div>
    </form>
  );
}
