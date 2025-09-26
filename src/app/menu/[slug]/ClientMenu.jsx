"use client";

import { useState, useMemo } from "react";
import { FaChevronLeft, FaMinus, FaPlus, FaShoppingCart } from "react-icons/fa";
import Image from "next/image";
import GenericModal from "@/components/GenericModal";

// util para contraste de cor
function getContrastTextColor(hex) {
  const DEFAULT_BACKGROUND = "#ffffff";
  const cleanHex = (hex || DEFAULT_BACKGROUND).replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

// helper: converte HH:mm -> minutos
function toMinutes(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

// checa se está aberto agora
function isOpenNow(hours) {
  const now = new Date();
  const timeString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const localNow = new Date(timeString);

  const day = localNow.toLocaleString("en-US", { weekday: "short" }).toLowerCase();
  const todayHours = hours?.[day] || null;
  if (!todayHours) return false;

  const [openStr, closeStr] = todayHours.split("-");
  const openMins = toMinutes(openStr);
  const closeMins = toMinutes(closeStr);
  const nowMins = localNow.getHours() * 60 + localNow.getMinutes();

  return nowMins >= openMins && nowMins <= closeMins;
}

// helper para mapear dias
const dayNames = {
  mon: "Segunda-feira",
  tue: "Terça-feira",
  wed: "Quarta-feira",
  thu: "Quinta-feira",
  fri: "Sexta-feira",
  sat: "Sábado",
  sun: "Domingo",
};

function formatHours(hours) {
  if (!hours) return [];

  return Object.entries(dayNames).map(([key, label]) => {
    const range = hours[key];
    if (!range) return { day: label, hours: "Fechado" };

    const [open, close] = range.split("-");
    return { day: label, hours: `${open} às ${close}` };
  });
}

export default function ClientMenu({ menu }) {
  const [hoursModalOpen, setHoursModalOpen] = useState(false);

  const open = isOpenNow(menu.hours);
  const translucidToUse = getContrastTextColor(menu.background_color) === "white" ? "#ffffff15" : "#00000015";
  const grayToUse = getContrastTextColor(menu.background_color) === "white" ? "#cccccc" : "#333333";
  const foregroundToUse = getContrastTextColor(menu.background_color) === "white" ? "#fafafa" : "#171717";

  const now = new Date();
  const timeString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const localNow = new Date(timeString);
  const todayKey = localNow.toLocaleString("en-US", { weekday: "short" }).toLowerCase();

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [quantity, setQuantity] = useState(1);

  // selectedAddons: mapa { "<idx>": true } (boolean selection only)
  const [selectedAddons, setSelectedAddons] = useState({});

  const orderedCategories = (menu?.categories || []).slice().sort((a, b) => {
    return Number(a.position ?? 0) - Number(b.position ?? 0);
  });

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setItemModalOpen(true);
    setQuantity(1);
    setSelectedAddons({});
  };

  const toggleAddon = (idx) => {
    setSelectedAddons((prev) => {
      const key = String(idx);
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  // calcula total: item * quantity + soma(addon.price)
  const totalPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const base = Number(selectedItem.price || 0) * quantity;
    const addons = (selectedItem.additionals || []).reduce((acc, a, idx) => {
      if (selectedAddons[String(idx)]) {
        return acc + Number(a.price || 0);
      }
      return acc;
    }, 0);
    return base + addons * quantity;
  }, [selectedItem, quantity, selectedAddons]);

  // Handler de adicionar ao carrinho (aqui apenas simulo o objeto)
  const handleAddToCart = () => {
    if (!selectedItem) return;
    const selected = (selectedItem.additionals || [])
      .map((a, idx) => {
        if (!selectedAddons[String(idx)]) return null;
        return { name: a.name, price: Number(a.price) };
      })
      .filter(Boolean);

    const cartItem = {
      id: selectedItem.id,
      name: selectedItem.name,
      price: Number(selectedItem.price),
      qty: quantity,
      additionals: selected,
      subtotal: totalPrice,
    };

    // Aqui você integra com seu estado global/carrinho
    // Por enquanto só log:
    console.log("Adicionar ao carrinho:", cartItem);

    // fechar modal e resetar
    setItemModalOpen(false);
    setSelectedItem(null);
    setQuantity(1);
    setSelectedAddons({});
  };

  return (
    <>
      <div className="min-h-screen w-full lg:px-20 xl:px-32 relative" style={{ backgroundColor: menu.background_color }}>
        {/* Indicador de status no topo direito */}
        <div
          className={`cursor-pointer absolute mt-2 flex items-center h-[35px] top-[calc(25dvh-50px)] right-2 lg:right-20 xl:right-32 px-3 py-1 mr-2 rounded-lg font-bold text-sm z-2`}
          style={{ backgroundColor: open ? "#16a34a90" : "#dc262690", color: "white" }}
          onClick={() => setHoursModalOpen(true)}
        >
          {open ? "Aberto agora" : "Fechado"}
        </div>

        {menu.banner_url && (
          <div className="relative w-full h-[25dvh]">
            <Image
              alt="Banner do estabelecimento"
              src={menu.banner_url}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        )}

        <div className="flex items-center mt-2 p-4">
          {menu.logo_url && (
            <div className="relative w-full max-w-[80px] aspect-[1/1] rounded-lg mr-2 sm:mr-4">
              <img
                alt="Logo do estabelecimento"
                src={menu.logo_url}
                className="object-cover rounded-lg cursor-pointer w-full h-full"
              />
            </div>
          )}

          <h1 className="text-2xl font-bold" style={{ color: menu.title_color }}>
            {menu.title}
          </h1>
        </div>

        <p className="mt-1 px-4" style={{ color: getContrastTextColor(menu.background_color) }}>
          {menu.description}
        </p>

        <div className="space-y-4 px-4">
          {orderedCategories.map((cat) => (
            <div key={cat.id} className="rounded py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <strong style={{ color: foregroundToUse }}>{cat.name}</strong>
                  <span className="text-sm" style={{ color: grayToUse }}>
                    ({cat.menu_items?.length ?? 0} itens)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(cat.menu_items || []).map((it) => (
                  <div key={it.id} className="flex items-stretch justify-between">
                    <div
                      className="cursor-pointer flex-1 h-[130px] flex flex-col items-start justify-between gap-2 p-2 rounded-lg"
                      style={{ backgroundColor: translucidToUse }}
                      onClick={() => handleItemClick(it)}
                    >
                      <div>
                        <div>
                          <div className="text-xl" style={{ color: foregroundToUse }}>
                            {it.name}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm line-clamp-2" style={{ color: grayToUse }}>
                            {it.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="text-2xl font-bold" style={{ color: foregroundToUse }}>
                          {it.price ? `R$ ${Number(it.price).toFixed(2)}` : "-"}
                        </div>
                        <div className="mr-2 px-6 py-2 rounded" style={{ backgroundColor: menu.details_color }}>
                          <FaShoppingCart
                            style={{
                              color: getContrastTextColor(menu.details_color),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {hoursModalOpen && (
        <GenericModal bgColor={menu.background_color} onClose={() => setHoursModalOpen(false)}>
          <div className="cursor-pointer flex items-center gap-4 mb-4" style={{ color: foregroundToUse }}>
            <FaChevronLeft onClick={() => setHoursModalOpen(false)} />
            <h3 className="font-semibold">Horários de funcionamento:</h3>
          </div>
          <div className="space-y-2" style={{ color: foregroundToUse }}>
            <div className="space-y-2">
              {formatHours(menu.hours).map(({ day, hours }, idx) => {
                const dayKey = Object.keys(dayNames)[idx]; // mon, tue, wed...
                const isToday = dayKey === todayKey;

                return (
                  <div
                    key={day}
                    className="flex justify-between px-2 py-1 rounded"
                    style={{ backgroundColor: isToday ? translucidToUse : "transparent" }}
                  >
                    <span>{day}:</span>
                    <span>{hours}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </GenericModal>
      )}

      {itemModalOpen && selectedItem && (
        <GenericModal
          onClose={() => {
            setItemModalOpen(false);
            setSelectedItem(null);
            setQuantity(1);
            setSelectedAddons({});
          }}
          bgColor={menu.background_color}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex flex-col gap-2 max-w-full sm:w-1/2">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: foregroundToUse }}>
                    {selectedItem.name}
                  </h2>
                  <p style={{ color: grayToUse }} className="line-clamp-4">
                    {selectedItem.description}
                  </p>
                </div>
                <span className="text-3xl font-semibold" style={{ color: foregroundToUse }}>
                  R$ {Number(selectedItem.price).toFixed(2)}
                </span>
              </div>

              <div className="max-w-full sm:w-1/2 sm:mt-6">
                <textarea
                  className="w-[100%] h-full p-2 border"
                  style={{
                    backgroundColor: translucidToUse,
                    color: foregroundToUse,
                    borderColor: grayToUse,
                  }}
                  placeholder="Comentário (opicional)"
                ></textarea>
              </div>
            </div>

            {/* adicionais: somente se existirem */}
            {Array.isArray(selectedItem.additionals) && selectedItem.additionals.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold" style={{ color: foregroundToUse }}>
                  Selecione adicionais:
                </div>

                {/* Linha de boxes que quebra */}
                <div className="flex flex-wrap gap-3">
                  {(selectedItem.additionals || []).map((a, idx) => {
                    const isSelected = !!selectedAddons[String(idx)];
                    // cores:
                    const boxBg = isSelected ? "#16a34a44" : translucidToUse; // verde translúcido quando selecionado
                    const textColor = getContrastTextColor(isSelected ? "#16a34a44" : menu.background_color);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleAddon(idx)}
                        className="flex flex-col items-center justify-center rounded-lg cursor-pointer p-2 min-w-[120px] text-center"
                        style={{
                          backgroundColor: boxBg,
                          color: textColor,
                          border: isSelected ? `1px solid #16a34a88` : "1px solid transparent",
                        }}
                      >
                        <div className="font-medium truncate">
                          {a.name}{" "}
                          <span className="text-sm" style={{ color: grayToUse }}>
                            R${Number(a.price).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* seletor de quantidade do item */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="cursor-pointer p-2 rounded bg-red-500 hover:bg-red-600 font-bold transition"
              >
                <FaMinus />
              </button>
              <span className="text-xl font-semibold" style={{ color: foregroundToUse }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="cursor-pointer p-2 rounded bg-green-500 hover:bg-green-600 font-bold transition"
              >
                <FaPlus />
              </button>
              <span style={{ color: grayToUse }}>(R${totalPrice.toFixed(2)})</span>
            </div>

            <button
              onClick={handleAddToCart}
              className="cursor-pointer p-2 gap-2 font-bold flex items-center justify-center rounded hover:opacity-90 transition"
              style={{ backgroundColor: menu.details_color, color: getContrastTextColor(menu.details_color) }}
            >
              <span>Adicionar {quantity} ao carrinho</span>
              <FaShoppingCart />
            </button>
          </div>
        </GenericModal>
      )}
    </>
  );
}
