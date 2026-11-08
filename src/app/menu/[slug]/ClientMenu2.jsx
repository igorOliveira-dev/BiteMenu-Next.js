"use client";

import { FaMapMarkerAlt, FaShoppingCart, FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import { formatCurrency } from "@/lib/formatCurrency";
import { supabaseImg } from "@/lib/imageUtils";
import BannerImage, { BANNER_ASPECT_CLASS } from "@/components/BannerImage";
import { formatOffset, zoneOffset } from "@/utils/storeHours";
import { getContrastTextColor } from "@/utils/color";
import { mapsUrl } from "@/components/AddressFields";
import LoyaltyBanner from "./components/LoyaltyBanner";
import MenuShell, { CategoryNav } from "./components/MenuShell";
import useClientMenu, { describeCombos, isSafeImageUrl } from "./useClientMenu";

export default function ClientMenu2({ menu: rawMenu, ownerPhone, ownerRole, demoTheme = false }) {
  const m = useClientMenu(rawMenu, ownerRole, demoTheme);
  const {
    menu,
    translucidToUse,
    grayToUse,
    foregroundToUse,
    openColor,
    closedColor,
    open,
    statusText,
    tzDiff,
    setHoursModalOpen,
    searchTerm,
    setSearchTerm,
    filteredCategories,
    totalVisibleItems,
    starredItems,
    hasStarred,
    hasPlusPermissions,
    canShowPromoPrice,
    itemCombos,
    categoryCombos,
    handleItemClick,
  } = m;

  return (
    <>
      <div className="min-h-screen w-full relative pb-18" style={{ backgroundColor: menu.background_color }}>
        {/* Banner */}
        {isSafeImageUrl(menu.banner_url) && (
          <div className={`relative w-full ${BANNER_ASPECT_CLASS}`}>
            <BannerImage
              desktop={supabaseImg(menu.banner_url, { quality: 70 })}
              mobile={isSafeImageUrl(menu.banner_mobile_url) ? supabaseImg(menu.banner_mobile_url, { quality: 70 }) : null}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)" }}
            />
          </div>
        )}

        {/* Cabeçalho centralizado — estilo bistrô */}
        <div
          className="flex flex-col items-center text-center pt-6 pb-4 px-4 border-b"
          style={{ borderColor: translucidToUse }}
        >
          {isSafeImageUrl(menu.logo_url) && (
            <div className="mb-3 -mt-10 relative z-10">
              <Image
                alt="Logo do estabelecimento"
                src={supabaseImg(menu.logo_url, { width: 200, height: 200, quality: 80 })}
                width={110}
                height={110}
                className="w-[84px] h-[84px] sm:w-[110px] sm:h-[110px] object-cover rounded-full border-2"
                style={{ borderColor: menu.background_color }}
                loading="lazy"
              />
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: menu.title_color }}>
            {menu.title}
          </h1>

          {menu.description && (
            <p className="mt-1 text-sm max-w-md" style={{ color: grayToUse }}>
              {menu.description}
            </p>
          )}

          <div
            className="cursor-pointer flex items-center mr-2 mb-2 rounded-lg text-sm z-2"
            style={{ color: open ? openColor : closedColor }}
            onClick={() => setHoursModalOpen(true)}
          >
            {statusText}
          </div>
          {tzDiff ? (
            <p className="-mt-2 mb-2 text-xs" style={{ color: grayToUse }}>
              Fuso da loja: {formatOffset(zoneOffset(menu.timezone))}
            </p>
          ) : null}

          {menu.address && (
            <a
              href={mapsUrl(menu.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-1 text-xs hover:underline"
              style={{ color: grayToUse }}
            >
              <FaMapMarkerAlt size={11} /> {menu.address}
            </a>
          )}

          <div className="flex flex-col items-center gap-3 mt-3">
            <button
              className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border"
              style={{ borderColor: translucidToUse, color: foregroundToUse }}
              onClick={() => window.open(`https://wa.me/${ownerPhone ?? null}`, "_blank")}
            >
              <FaWhatsapp size={13} /> WhatsApp
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="px-4 sm:px-8 lg:px-20 xl:px-32 mt-4 mb-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar item do cardápio..."
            className="w-full py-2 px-4 rounded-full border outline-none text-sm"
            style={{ backgroundColor: translucidToUse, color: foregroundToUse, borderColor: translucidToUse }}
          />
        </div>

        <LoyaltyBanner
          loyalty={menu.loyalty}
          menuId={menu.id}
          slug={menu.slug}
          className="px-4 sm:px-8 lg:px-20 xl:px-32 mb-3"
          colors={{ text: foregroundToUse, muted: grayToUse, track: translucidToUse, accent: menu.details_color }}
        />

        <CategoryNav m={m} className="lg:mx-20 xl:mx-32" />

        <div className="px-4 sm:px-8 lg:px-20 xl:px-32">
          {/* Destaques — carrossel horizontal */}
          {hasStarred && hasPlusPermissions && searchTerm === "" && (
            <div className="py-6" id="starred-section">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: grayToUse }}>
                Destaques
              </p>
              <div
                className="flex gap-4 overflow-x-auto pb-2 starred-scroll"
                style={{
                  scrollSnapType: "x mandatory",
                  "--scrollbar-color": menu.details_color,
                }}
              >
                {starredItems.map((it) => (
                  <div
                    key={it.id}
                    className="min-w-[220px] max-w-[220px] snap-start cursor-pointer rounded-2xl overflow-hidden"
                    style={{ backgroundColor: translucidToUse }}
                    onClick={() => handleItemClick(it)}
                  >
                    {isSafeImageUrl(it.image_url) && (
                      <div className="w-full aspect-square overflow-hidden">
                        <Image
                          src={supabaseImg(it.image_url, { width: 400, height: 400, quality: 85 })}
                          alt={it.name}
                          width={220}
                          height={220}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-sm line-clamp-1" style={{ color: foregroundToUse }}>
                        {it.name}
                      </p>
                      <p className="text-xs line-clamp-2 mt-0.5" style={{ color: grayToUse }}>
                        {it.description}
                      </p>
                      {itemCombos[it.id]?.length > 0 && (
                        <div className="text-xs font-semibold mt-1 space-y-0.5" style={{ color: menu.details_color }}>
                          {describeCombos(itemCombos[it.id], menu?.currency).map((line, idx) => (
                            <div key={idx}>{line}</div>
                          ))}
                        </div>
                      )}
                      {it.promo_price && canShowPromoPrice ? (
                        <div className="mt-2">
                          <span className="text-xs line-through" style={{ color: grayToUse }}>
                            {formatCurrency(it.price, menu?.currency)}
                          </span>
                          <p className="font-bold text-base" style={{ color: foregroundToUse }}>
                            {formatCurrency(it.promo_price, menu?.currency)}
                          </p>
                        </div>
                      ) : (
                        <p className="font-bold text-base mt-2" style={{ color: foregroundToUse }}>
                          {it.variations?.options?.length > 0 && <span className="block text-xs font-normal">a partir de</span>}
                          {formatCurrency(it.price, menu?.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalVisibleItems === 0 && (
            <div className="text-center py-8">
              <p style={{ color: grayToUse }}>Nenhum item encontrado.</p>
            </div>
          )}

          {/* Lista estilo bistrô — sem grid, linha por item com separador */}
          <div className="space-y-8 pb-6">
            {filteredCategories.map((cat) => {
              const visibleItems = (cat.menu_items || []).filter((it) => it.visible);
              if (visibleItems.length === 0) return null;

              return (
                <div key={cat.id} id={cat.id.slice(0, 5)}>
                  {/* Título de categoria com ornamento */}
                  <div className="flex items-center gap-3 flex-wrap pt-6 mb-2">
                    <strong className="text-lg font-extrabold tracking-tight" style={{ color: foregroundToUse }}>{cat.name}</strong>
                    {categoryCombos[cat.id]?.length > 0 && (
                      <span
                        className="text-xs font-semibold flex flex-wrap gap-x-2"
                        style={{ color: menu.details_color }}
                      >
                        {describeCombos(categoryCombos[cat.id], menu?.currency).map((line, idx) => (
                          <span key={idx}>{line}</span>
                        ))}
                      </span>
                    )}
                  </div>

                  <div>
                    {visibleItems.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-4 py-4 cursor-pointer group border-b min-h-[170px]"
                        style={{ borderColor: translucidToUse }}
                        onClick={() => handleItemClick(it)}
                      >
                        {/* Texto à esquerda */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base leading-snug" style={{ color: foregroundToUse }}>
                            {it.name}
                          </p>
                          {it.description && (
                            <p
                              className="text-sm mt-0.5 line-clamp-2 leading-relaxed"
                              style={{ color: grayToUse, wordBreak: "normal", overflowWrap: "anywhere" }}
                            >
                              {it.description?.replace(/,\s*/g, ", ")}
                            </p>
                          )}

                          {itemCombos[it.id]?.length > 0 && (
                            <div
                              className="text-xs font-semibold mt-1 space-y-0.5"
                              style={{ color: menu.details_color }}
                            >
                              {describeCombos(itemCombos[it.id], menu?.currency).map((line, idx) => (
                                <div key={idx}>{line}</div>
                              ))}
                            </div>
                          )}

                          {/* Preço abaixo da descrição */}
                          <div className="mt-2">
                            {it.promo_price && canShowPromoPrice ? (
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs line-through" style={{ color: grayToUse }}>
                                  {formatCurrency(it.price, menu?.currency)}
                                </span>
                                <span className="font-bold text-lg" style={{ color: foregroundToUse }}>
                                  {formatCurrency(it.promo_price, menu?.currency)}
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-lg" style={{ color: foregroundToUse }}>
                                {it.variations?.options?.length > 0 && <span className="block text-xs font-normal">a partir de</span>}
                                {formatCurrency(it.price, menu?.currency)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Imagem + botão à direita */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          {isSafeImageUrl(it.image_url) && (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden">
                              <Image
                                src={
                                  it.thumb_url || supabaseImg(it.image_url, { width: 120, height: 120, quality: 80 })
                                }
                                alt={it.name}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: menu.details_color }}
                          >
                            <FaShoppingCart size={13} style={{ color: getContrastTextColor(menu.details_color) }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <MenuShell m={m} ownerPhone={ownerPhone} ownerRole={ownerRole} />
    </>
  );
}
