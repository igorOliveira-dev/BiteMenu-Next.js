import BackArrow from "@/components/BackArrow";
import React, { useEffect, useState } from "react";
import { FaPen, FaInfoCircle } from "react-icons/fa";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import useMenu from "@/hooks/useMenu";
import Loading from "@/components/Loading";

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

const ConfigMenu = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();

  // estados de titulo / descrição / slug
  const [title, setTitle] = useState(menu?.title);
  const [description, setDescription] = useState(menu?.description);
  const [slug, setSlug] = useState(menu?.slug);

  // estados de cores
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND || menu?.background_color);
  const [titleColor, setTitleColor] = useState(DEFAULT_TITLE || menu?.title_color);
  const [detailsColor, setDetailsColor] = useState(DEFAULT_DETAILS || menu?.details_color);

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
    }
    if (menu?.description) {
      setDescription(menu.description);
    }
    if (menu?.slug) {
      setSlug(menu.slug);
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
            <div className="flex w-full">
              <span className="bg-translucid p-2 rounded-lg w-full">{title}</span>
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
            <div className="flex w-full">
              <span className="bg-translucid p-2 rounded-lg w-full">{description}</span>
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
            <div className="flex w-full items-center">
              <span>bitemenu.com.br/menu/</span>
              <span className="bg-translucid p-2 rounded-lg w-full overflow-hidden whitespace-nowrap text-ellipsis">
                {slug}
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
  );
};

export default ConfigMenu;
