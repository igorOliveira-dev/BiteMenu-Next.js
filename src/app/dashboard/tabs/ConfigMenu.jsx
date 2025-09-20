import BackArrow from "@/components/BackArrow";
import React, { useEffect, useState } from "react";
import { FaPen, FaInfoCircle } from "react-icons/fa";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import useMenu from "@/hooks/useMenu";
import Loading from "@/components/Loading";
import GenericModal from "@/components/GenericModal";

const DEFAULT_BACKGROUND = COLOR_PALETTES[0].bg;
const DEFAULT_TITLE = COLOR_PALETTES[0].title;
const DEFAULT_DETAILS = COLOR_PALETTES[0].details;

function getContrastTextColor(hex) {
  const cleanHex = (hex || DEFAULT_BACKGROUND).replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

const ConfigMenu = ({
  setSelectedTab,
  title,
  setTitle,
  description,
  setDescription,
  backgroundColor,
  setBackgroundColor,
  titleColor,
  setTitleColor,
  detailsColor,
  setDetailsColor,
}) => {
  const { menu, loading } = useMenu();

  // controle de modais
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [slugModalOpen, setSlugModalOpen] = useState(false);

  // estados de titulo / descrição / slug
  const [slug, setSlug] = useState(menu?.slug);

  // estados temporários de titulo / descrição / slug
  const [tempTitle, setTempTitle] = useState(title);
  const [tempDescription, setTempDescription] = useState(description);
  const [tempSlug, setTempSlug] = useState(slug);

  // estados de cores
  const [paletteIndex, setPaletteIndex] = useState(0);

  const colorFields = [
    { label: "Cor do fundo:", value: backgroundColor, setter: setBackgroundColor },
    { label: "Cor do título:", value: titleColor, setter: setTitleColor },
    { label: "Cor dos detalhes:", value: detailsColor, setter: setDetailsColor },
  ];

  // estados de serviços
  const [selectedServices, setSelectedServices] = useState(menu?.services || []);
  const serviceOptions = [
    { id: "delivery", label: "Entrega" },
    { id: "pickup", label: "Retirada" },
    { id: "dinein", label: "Comer no local" },
    { id: "takeaway", label: "Para viagem" },
    { id: "driveThru", label: "Drive-thru" },
  ];

  const dayLabels = {
    mon: "Seg",
    tue: "Ter",
    wed: "Qua",
    thu: "Qui",
    fri: "Sex",
    sat: "Sáb",
    sun: "Dom",
  };

  const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const [hours, setHours] = useState(() =>
    normalizeHours(
      menu?.hours || {
        days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        hours: "00:00-23:59",
      }
    )
  );

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

  // alterna checkbox de serviços
  const toggleService = (id) => {
    setSelectedServices((prev) => {
      if (prev.length === 1 && prev.includes(id)) {
        return prev;
      }
      return prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
    });
  };

  useEffect(() => {
    if (menu?.title) {
      setTitle(menu.title);
      setTempTitle(menu.title);
    }
    if (menu?.description) {
      setDescription(menu.description);
      setTempDescription(menu.description);
    }
    if (menu?.slug) {
      setSlug(menu.slug);
      setTempSlug(menu.slug);
    }
    if (menu?.services) {
      setSelectedServices(menu.services);
    }
    if (menu?.background_color) {
      setBackgroundColor(menu.background_color);
    }
    if (menu?.title_color) {
      setTitleColor(menu.title_color);
    }
    if (menu?.background_color) {
      setBackgroundColor(menu.background_color);
    }
    if (menu?.hours) {
      setHours(normalizeHours(menu.hours));
    }
  }, [menu]);

  useEffect(() => {
    setTempTitle(title);
    setTempDescription(description);
  }, [title, description]);

  function normalizeHours(data) {
    // se vier no formato antigo
    if (data?.hours && typeof data.hours === "string") {
      const obj = {};
      data.days.forEach((day) => {
        obj[day] = data.hours; // todos os dias iguais
      });
      return obj;
    }
    // se já estiver no novo formato
    return data;
  }

  if (loading) return <Loading />;

  return (
    <>
      <div className="flex flex-col items-center lg:items-start">
        <div className="m-2 max-w-[720px] sm:w-[calc(100dvw-86px)] w-[calc(100dvw-40px)]">
          <div className="flex items-center mb-4">
            <div onClick={() => setSelectedTab("menu")}>
              <BackArrow />
            </div>
            <h2 className="ml-2">Configurações do cardápio</h2>
          </div>

          <div>
            <div className="flex sm:items-center max-w-full min-h-[46px] flex-col sm:flex-row">
              <div className="flex items-center">
                <FaInfoCircle fontSize={18} className="cursor-pointer mr-2 shrink-0" />
                <p className="font-semibold mr-2 whitespace-nowrap">Nome do estabelecimento:</p>
              </div>
              <div onClick={() => setTitleModalOpen(true)} className="flex w-full">
                <span className="bg-translucid p-2 rounded-lg w-full">
                  {title ? title : <span className="color-gray">Insira o nome</span>}
                </span>
                <button className="border border-2 border-gray-500 p-2 bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100 cursor-pointer">
                  <FaPen className="font-xl text-white opacity-75" />
                </button>
              </div>
            </div>
            <hr className="border-[var(--gray)] mt-2 mb-4 max-w-full" />
          </div>

          <div>
            <div className="flex sm:items-center max-w-full min-h-[46px] flex-col sm:flex-row">
              <div className="flex items-center">
                <FaInfoCircle fontSize={18} className="cursor-pointer mr-2 shrink-0" />
                <p className="font-semibold mr-2 whitespace-nowrap">Descrição:</p>
              </div>
              <div onClick={() => setDescModalOpen(true)} className="flex w-full">
                <span className="bg-translucid p-2 rounded-lg w-full">
                  {description ? description : <span className="color-gray">Insira a descrição</span>}
                </span>
                <button className="border border-2 border-gray-500 p-2 bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100 cursor-pointer">
                  <FaPen className="font-xl text-white opacity-75" />
                </button>
              </div>
            </div>
            <hr className="border-[var(--gray)] mt-2 mb-4 max-w-full" />
          </div>

          <div>
            <div className="flex sm:items-center max-w-full min-h-[46px] flex-col sm:flex-row">
              <div className="flex items-center">
                <FaInfoCircle fontSize={18} className="cursor-pointer mr-2 shrink-0" />
                <p className="font-semibold mr-2 whitespace-nowrap">Slug:</p>
              </div>
              <div onClick={() => setSlugModalOpen(true)} className="flex w-full items-center">
                <span>bitemenu.com.br/menu/</span>
                <span className="bg-translucid p-2 rounded-lg w-full overflow-hidden whitespace-nowrap text-ellipsis">
                  {slug ? slug : <span className="color-gray">Insira o slug</span>}
                </span>
                <button className="border border-2 border-gray-500 p-2 bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100 cursor-pointer">
                  <FaPen className="font-xl text-white opacity-75" />
                </button>
              </div>
            </div>
            <hr className="border-[var(--gray)] mt-2 mb-4 max-w-full" />
          </div>

          {/* Nova seção: seletores de cor (inspirado no GetStart) */}
          <div className="mt-2 max-w-full">
            <div className="flex items-center mb-2">
              <FaInfoCircle fontSize={18} className="cursor-pointer mr-2 shrink-0" />
              <p className="font-semibold">Cores do cardápio:</p>
            </div>

            <div className="flex flex-col space-y-3">
              {colorFields.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <label className="w-36">{item.label}</label>
                  <input
                    type="color"
                    value={item.value}
                    onChange={(e) => item.setter(e.target.value)}
                    className="h-8 w-8 rounded"
                    aria-label={item.label}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center space-x-3">
              <button
                type="button"
                onClick={suggestRandomPalette}
                className="cursor-pointer px-4 py-2 rounded-lg gray-button text-sm font-medium transition"
              >
                💡 Sugerir cores
              </button>
            </div>
            <hr className="border-[var(--gray)] mt-2 mb-4 max-w-full" />
          </div>

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <FaInfoCircle fontSize={18} className="cursor-pointer mr-2 shrink-0" />
              <p className="font-semibold">Serviços disponíveis:</p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-160">
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

          <div className="mb-4">
            <div className="flex items-center mb-2">
              <FaInfoCircle fontSize={18} className="cursor-pointer mr-2 shrink-0" />
              <p className="font-semibold">Horários de funcionamento:</p>
            </div>

            <div className="flex flex-col space-y-2">
              {dayOrder.map((day) => {
                const value = hours[day];
                const [openTime, closeTime] = value ? value.split("-") : ["", ""];

                return (
                  <div key={day} className="flex items-center space-x-2">
                    <label className="w-10">{dayLabels[day]}</label>

                    <input
                      type="time"
                      value={openTime}
                      disabled={!value}
                      onChange={(e) => {
                        const newOpen = e.target.value;
                        setHours((prev) => ({
                          ...prev,
                          [day]: `${newOpen}-${closeTime || "23:59"}`,
                        }));
                      }}
                      className="border rounded p-1 cursor-pointer"
                    />

                    <span>-</span>

                    <input
                      type="time"
                      value={closeTime}
                      disabled={!value}
                      onChange={(e) => {
                        const newClose = e.target.value;
                        setHours((prev) => ({
                          ...prev,
                          [day]: `${openTime || "00:00"}-${newClose}`,
                        }));
                      }}
                      className="border rounded p-1 text-foreground cursor-pointer"
                    />

                    <label className="ml-2 flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value === null}
                        onChange={(e) =>
                          setHours((prev) => ({
                            ...prev,
                            [day]: e.target.checked ? null : "09:00-18:00",
                          }))
                        }
                      />
                      <span>Fechado</span>
                    </label>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="mt-3 gray-button px-4 py-2 rounded-lg"
              onClick={() => {
                setHours((prev) => {
                  const newObj = {};
                  Object.keys(prev).forEach((day) => {
                    newObj[day] = "00:00-23:59";
                  });
                  return newObj;
                });
              }}
            >
              Definir 24h para todos
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* --------------------------- MODAIS --------------------------- */}
      {/* -------------------------------------------------------------- */}

      {/* Modal de título */}
      {titleModalOpen && (
        <GenericModal onClose={() => setTitleModalOpen(false)}>
          <h3 className="font-bold mb-4">Alterar nome</h3>
          <input
            type="text"
            placeholder="Novo título"
            value={tempTitle || ""}
            onChange={(e) => setTempTitle(e.target.value)}
            className="w-full p-2 rounded border bg-translucid mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempTitle(title);
                setTitleModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setTitle(tempTitle);
                setTitleModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {/* Modal de descrição */}
      {descModalOpen && (
        <GenericModal onClose={() => setDescModalOpen(false)}>
          <h3 className="font-bold mb-4">Alterar descrição</h3>
          <input
            type="text"
            placeholder="Nova descrição"
            value={tempDescription || ""}
            onChange={(e) => setTempDescription(e.target.value)}
            className="w-full p-2 rounded border bg-translucid mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempDescription(description);
                setDescModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setDescription(tempDescription);
                setDescModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {/* Modal de slug */}
      {slugModalOpen && (
        <GenericModal onClose={() => setSlugModalOpen(false)}>
          <h3 className="font-bold mb-4">Alterar slug</h3>
          <input
            type="text"
            placeholder="Novo slug"
            value={tempSlug || ""}
            onChange={(e) => setTempSlug(e.target.value)}
            className="w-full p-2 rounded border bg-translucid mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempSlug(slug);
                setSlugModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setSlug(tempSlug);
                setSlugModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}
    </>
  );
};

export default ConfigMenu;
