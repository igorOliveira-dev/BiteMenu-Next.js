// src/app/dashboard/tabs/ConfigMenu.jsx
"use client";

import BackArrow from "@/components/BackArrow";
import React, { useEffect, useState } from "react";
import { FaPen, FaInfoCircle, FaChevronLeft } from "react-icons/fa";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import useMenu from "@/hooks/useMenu";
import Loading from "@/components/Loading";
import GenericModal from "@/components/GenericModal";
import { useAlert } from "@/providers/AlertProvider";

const DEFAULT_HOURS = {
  mon: "09:00-18:00",
  tue: "09:00-18:00",
  wed: "09:00-18:00",
  thu: "09:00-18:00",
  fri: "09:00-18:00",
  sat: "10:00-14:00",
  sun: null,
};

const DEFAULT_BACKGROUND = COLOR_PALETTES[0].bg;

function getContrastTextColor(hex) {
  const cleanHex = (hex || DEFAULT_BACKGROUND).replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

function normalizeHours(data) {
  if (!data) return { ...DEFAULT_HOURS };
  // compatibilidade com formato antigo
  if (data?.hours && typeof data.hours === "string" && Array.isArray(data.days)) {
    const obj = {};
    data.days.forEach((day) => {
      obj[day] = data.hours;
    });
    return { ...DEFAULT_HOURS, ...obj };
  }
  return { ...DEFAULT_HOURS, ...data };
}

const ConfigMenu = (props) => {
  const {
    setSelectedTab,
    title: propTitle,
    setTitle: propSetTitle,
    description: propDescription,
    setDescription: propSetDescription,
    backgroundColor: propBg,
    setBackgroundColor: propSetBg,
    titleColor: propTitleColor,
    setTitleColor: propSetTitleColor,
    detailsColor: propDetailsColor,
    setDetailsColor: propSetDetailsColor,
    menuState, // optional [state, setState]
  } = props;

  const customAlert = useAlert();

  const usingExternal = Array.isArray(menuState) && menuState.length === 2;
  const [externalState, externalSetState] = usingExternal ? menuState : [null, null];

  const { menu, loading } = useMenu();

  // estados locais (fallback)
  const [slugLocal, setSlugLocal] = useState(menu?.slug ?? "");
  const [selectedServicesLocal, setSelectedServicesLocal] = useState(menu?.services ?? []);
  const [hoursLocal, setHoursLocal] = useState(() => normalizeHours(menu?.hours));

  // getters/setters unificados (slug / services)
  const slug = usingExternal ? externalState?.slug : slugLocal;
  const setSlug = usingExternal ? (v) => externalSetState((p) => ({ ...p, slug: v })) : setSlugLocal;

  const selectedServices = usingExternal ? externalState?.selectedServices : selectedServicesLocal;
  const setSelectedServices = usingExternal
    ? (arr) => externalSetState((p) => ({ ...p, selectedServices: arr }))
    : setSelectedServicesLocal;

  // hours: para renderizar sempre usamos a versão normalizada
  const hours = normalizeHours(usingExternal ? externalState?.hours : hoursLocal);

  // wrapper seguro para atualizar "hours" que aceita updater function ou objeto
  const safeSetHours = (updaterOrValue) => {
    if (usingExternal) {
      // externalSetState recebe função que recebe o estado externo completo
      if (typeof updaterOrValue === "function") {
        externalSetState((prev) => {
          const prevHours = normalizeHours(prev?.hours);
          const nextRaw = updaterOrValue(prevHours);
          const next = normalizeHours(nextRaw);
          return { ...prev, hours: next };
        });
      } else {
        externalSetState((prev) => ({ ...prev, hours: normalizeHours(updaterOrValue) }));
      }
    } else {
      // setHoursLocal aceita updater function
      setHoursLocal((prevRaw) => {
        const prevHours = normalizeHours(prevRaw);
        if (typeof updaterOrValue === "function") {
          const nextRaw = updaterOrValue(prevHours);
          return normalizeHours(nextRaw);
        } else {
          return normalizeHours(updaterOrValue);
        }
      });
    }
  };

  // modais
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [slugModalOpen, setSlugModalOpen] = useState(false);

  // temps
  const [tempTitle, setTempTitle] = useState(propTitle ?? "");
  const [tempDescription, setTempDescription] = useState(propDescription ?? "");
  const [tempSlug, setTempSlug] = useState(slug ?? "");

  useEffect(() => {
    if (menu) {
      if (menu.title) {
        if (!usingExternal && typeof propSetTitle === "function") {
          propSetTitle(menu.title);
        }
        setTempTitle(menu.title);
      }
      if (menu.description) {
        if (!usingExternal && typeof propSetDescription === "function") {
          propSetDescription(menu.description);
        }
        setTempDescription(menu.description);
      }
      if (menu.slug) {
        if (!usingExternal) setSlugLocal(menu.slug);
        setTempSlug(menu.slug);
      }
      if (menu.services && !usingExternal) setSelectedServices(menu.services);
      if (menu.background_color && !usingExternal && typeof propSetBg === "function") propSetBg(menu.background_color);
      if (menu.title_color && !usingExternal && typeof propSetTitleColor === "function") propSetTitleColor(menu.title_color);
      if (menu.hours && !usingExternal) safeSetHours(menu.hours);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.id]);

  useEffect(() => {
    setTempTitle(propTitle);
    setTempDescription(propDescription);
  }, [propTitle, propDescription]);

  const [paletteIndex, setPaletteIndex] = useState(0);
  const colorFields = [
    { label: "Cor do fundo:", value: propBg, setter: propSetBg },
    { label: "Cor do título:", value: propTitleColor, setter: propSetTitleColor },
    { label: "Cor dos detalhes:", value: propDetailsColor, setter: propSetDetailsColor },
  ];

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

  const suggestRandomPalette = () => {
    let next = Math.floor(Math.random() * COLOR_PALETTES.length);
    while (next === paletteIndex) {
      next = Math.floor(Math.random() * COLOR_PALETTES.length);
    }
    setPaletteIndex(next);
    const { bg, title, details } = COLOR_PALETTES[next];
    if (usingExternal) {
      externalSetState((p) => ({ ...p, backgroundColor: bg, titleColor: title, detailsColor: details }));
    } else {
      if (typeof propSetBg === "function") propSetBg(bg);
      if (typeof propSetTitleColor === "function") propSetTitleColor(title);
      if (typeof propSetDetailsColor === "function") propSetDetailsColor(details);
    }
  };

  const toggleService = (id) => {
    const prev = selectedServices || [];
    if (prev.length === 1 && prev.includes(id)) {
      customAlert("Mantenha ao menos 1 serviço.");
      return;
    }
    let next;
    if (prev.includes(id)) next = prev.filter((s) => s !== id);
    else next = [...prev, id];
    setSelectedServices(next);
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="sm:pb-0 pb-32 flex flex-col items-center lg:items-start">
        <div className="m-2 max-w-[720px] sm:w-[calc(100dvw-86px)] w-[calc(100dvw-40px)]">
          <div className="flex items-center mb-4">
            <div onClick={() => setSelectedTab("menu")}>
              <BackArrow />
            </div>
            <h2 className="ml-2">Configurações do cardápio</h2>
          </div>

          {/* Nome */}
          <div>
            <div className="flex sm:items-center max-w-full min-h-[46px] flex-col sm:flex-row">
              <div className="flex items-center">
                <FaInfoCircle fontSize={18} className="cursor-pointer mr-2 shrink-0" />
                <p className="font-semibold mr-2 whitespace-nowrap">Nome do estabelecimento:</p>
              </div>
              <div onClick={() => setTitleModalOpen(true)} className="flex w-full">
                <span className="bg-translucid p-2 rounded-lg w-full">
                  {propTitle ? propTitle : <span className="color-gray">Insira o nome</span>}
                </span>
                <button className="border border-2 border-gray-500 p-2 bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100 cursor-pointer">
                  <FaPen className="font-xl text-white opacity-75" />
                </button>
              </div>
            </div>
            <hr className="border-[var(--gray)] mt-2 mb-4 max-w-full" />
          </div>

          {/* Description */}
          <div>
            <div className="flex sm:items-center max-w-full min-h-[46px] flex-col sm:flex-row">
              <div className="flex items-center">
                <FaInfoCircle fontSize={18} className="cursor-pointer mr-2 shrink-0" />
                <p className="font-semibold mr-2 whitespace-nowrap">Descrição:</p>
              </div>
              <div onClick={() => setDescModalOpen(true)} className="flex w-full">
                <span className="bg-translucid p-2 rounded-lg w-full">
                  {propDescription ? propDescription : <span className="color-gray">Insira a descrição</span>}
                </span>
                <button className="border border-2 border-gray-500 p-2 bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100 cursor-pointer">
                  <FaPen className="font-xl text-white opacity-75" />
                </button>
              </div>
            </div>
            <hr className="border-[var(--gray)] mt-2 mb-4 max-w-full" />
          </div>

          {/* Slug */}
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

          {/* Colors */}
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
                    onChange={(e) => item.setter && item.setter(e.target.value)}
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

          {/* Services */}
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
                    checked={selectedServices?.includes(opt.id)}
                    onChange={() => toggleService(opt.id)}
                    className="peer appearance-none w-6 h-6 border-2 rounded-md transition-all duration-150 flex items-center justify-center relative"
                    style={{
                      borderColor: "#155dfc",
                      backgroundColor: selectedServices?.includes(opt.id) ? "#155dfc" : "transparent",
                    }}
                  />
                  <span
                    className="relative after:content-['✓'] after:absolute after:text-white after:text-sm after:font-bold after:top-[3px] after:left-[-25px] peer-checked:after:opacity-100 after:opacity-0 transition-opacity duration-150"
                    style={{ color: "var(--gray)" }}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <FaInfoCircle fontSize={18} className="cursor-pointer mr-2 shrink-0" />
              <p className="font-semibold">Horários de funcionamento:</p>
            </div>

            <div className="flex flex-col space-y-2">
              {dayOrder.map((day) => {
                const value = hours?.[day];
                const isClosed = value === null;
                const [openTime, closeTime] = typeof value === "string" ? value.split("-") : ["", ""];

                return (
                  <div key={day} className="flex items-center space-x-2">
                    <label className="w-10">{dayLabels[day]}</label>

                    <input
                      type="time"
                      value={openTime || ""}
                      disabled={isClosed}
                      onChange={(e) => {
                        const newOpen = e.target.value;
                        safeSetHours((prev) => {
                          const base = { ...prev };
                          const currentClose = typeof base[day] === "string" ? base[day].split("-")[1] : "23:59";
                          base[day] = `${newOpen}-${currentClose || "23:59"}`;
                          return base;
                        });
                      }}
                      className="border rounded p-1 cursor-pointer"
                    />

                    <span>-</span>

                    <input
                      type="time"
                      value={closeTime || ""}
                      disabled={isClosed}
                      onChange={(e) => {
                        const newClose = e.target.value;
                        safeSetHours((prev) => {
                          const base = { ...prev };
                          const currentOpen = typeof base[day] === "string" ? base[day].split("-")[0] : "00:00";
                          base[day] = `${currentOpen || "00:00"}-${newClose}`;
                          return base;
                        });
                      }}
                      className="border rounded p-1 text-foreground cursor-pointer"
                    />

                    <label className="ml-2 flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isClosed}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          safeSetHours((prev) => {
                            const base = { ...prev };
                            base[day] = checked ? null : typeof base[day] === "string" ? base[day] : DEFAULT_HOURS[day];
                            return base;
                          });
                        }}
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
                safeSetHours((prev) => {
                  const newObj = { ...prev };
                  Object.keys(newObj).forEach((d) => {
                    newObj[d] = "00:00-23:59";
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

      {/* MODALS */}
      {titleModalOpen && (
        <GenericModal onClose={() => setTitleModalOpen(false)}>
          <div className="flex items-center gap-4 mb-4">
            <FaChevronLeft onClick={() => setTitleModalOpen(false)} />
            <h3 className="font-bold">Alterar nome</h3>
          </div>
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
                setTempTitle(propTitle);
                setTitleModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (usingExternal) externalSetState((p) => ({ ...p, title: tempTitle }));
                else if (typeof propSetTitle === "function") propSetTitle(tempTitle);
                setTitleModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {descModalOpen && (
        <GenericModal onClose={() => setDescModalOpen(false)}>
          <div className="flex items-center gap-4 mb-4">
            <FaChevronLeft onClick={() => setDescModalOpen(false)} />
            <h3 className="font-bold">Alterar descrição</h3>
          </div>

          <textarea
            placeholder="Nova descrição"
            value={tempDescription || ""}
            onChange={(e) => {
              // limita imediatamente a 200 caracteres
              const v = e.target.value.slice(0, 200);
              setTempDescription(v);
            }}
            maxLength={200}
            rows={4}
            className="w-full p-2 rounded border bg-translucid mb-2"
          />

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm color-gray">{(tempDescription || "").length}/200</div>
            <div className="text-sm color-gray">Dica: seja objetivo.</div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempDescription(propDescription);
                setDescModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>

            <button
              onClick={() => {
                // garantir que nunca salve mais de 200 chars
                const finalDesc = (tempDescription || "").slice(0, 200);

                if (usingExternal) externalSetState((p) => ({ ...p, description: finalDesc }));
                else if (typeof propSetDescription === "function") propSetDescription(finalDesc);

                setDescModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {slugModalOpen && (
        <GenericModal onClose={() => setSlugModalOpen(false)}>
          <div className="flex items-center gap-4 mb-4">
            <FaChevronLeft onClick={() => setSlugModalOpen(false)} />
            <h3 className="font-bold">Alterar slug</h3>
          </div>
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
                if (usingExternal) externalSetState((p) => ({ ...p, slug: tempSlug }));
                else setSlugLocal(tempSlug);
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
