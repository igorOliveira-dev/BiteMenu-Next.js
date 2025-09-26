"use client";

import { useState } from "react";
import { FaChevronLeft, FaShoppingCart } from "react-icons/fa";
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
          {menu.categories.map((cat) => (
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
                      className="flex-1 h-[120px] flex flex-col items-start justify-between gap-2 p-2 rounded-lg"
                      style={{ backgroundColor: translucidToUse }}
                    >
                      <div>
                        <div>
                          <div className="text-xl font-bold" style={{ color: foregroundToUse }}>
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
                        <div className="text-2xl font-medium" style={{ color: foregroundToUse }}>
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

      {hoursModalOpen ? (
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
      ) : null}
    </>
  );
}
