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

export default function ClientMenu({ menu: rawMenu, ownerPhone, ownerRole, demoTheme = false }) {
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
      <div
        className="min-h-screen w-full lg:px-20 xl:px-32 relative pb-18"
        style={{ backgroundColor: menu.background_color }}
      >
        {/* Banner (Next/Image com sizes) */}
        {isSafeImageUrl(menu.banner_url) && (
          <div className={`relative w-full ${BANNER_ASPECT_CLASS}`}>
            <BannerImage
              desktop={supabaseImg(menu.banner_url, { quality: 70 })}
              mobile={isSafeImageUrl(menu.banner_mobile_url) ? supabaseImg(menu.banner_mobile_url, { quality: 70 }) : null}
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="py-4">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center min-w-full">
              {/* Logo (Next/Image em vez de <img>) */}
              {isSafeImageUrl(menu.logo_url) && (
                <div className="mr-2 sm:mr-4">
                  <Image
                    alt="Logo do estabelecimento"
                    src={supabaseImg(menu.logo_url, { width: 200, height: 200, quality: 80 })}
                    width={96}
                    height={96}
                    className="w-[56px] xxs:w-[66px] sm:w-[96px] aspect-square object-cover rounded-xl"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex flex-col items-start">
                <h1
                  className="text-xl xs:text-2xl md:text-3xl font-extrabold tracking-tight line-clamp-2 pr-8"
                  style={{ color: menu.title_color }}
                >
                  {menu.title}
                </h1>

                {ownerRole === "free" ? (
                  <a
                    href="https://www.bitemenu.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] xs:text-xs mb-1 hover:underline"
                    style={{ color: grayToUse }}
                  >
                    Feito com Bite Menu ↗
                  </a>
                ) : null}

                <div
                  className="cursor-pointer flex items-center mr-2 rounded-lg text-sm z-2"
                  style={{ color: open ? openColor : closedColor }}
                  onClick={() => setHoursModalOpen(true)}
                >
                  {statusText}
                </div>
                {tzDiff ? (
                  <p className="text-xs" style={{ color: grayToUse }}>
                    Fuso da loja: {formatOffset(zoneOffset(menu.timezone))}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className="cursor-pointer hover:opacity-70 transition transform-[translatex(-100%)]"
              onClick={() => window.open(`https://wa.me/${ownerPhone ?? null}`, "_blank")}
            >
              <FaWhatsapp style={{ color: foregroundToUse }} size={28} />
            </div>
          </div>

          {menu.address && (
            <a
              href={mapsUrl(menu.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 flex items-center my-2 hover:underline"
              style={{ color: grayToUse }}
            >
              <FaMapMarkerAlt className="inline mr-2" />
              {menu.address}
            </a>
          )}

          <p className="mt-1 px-4" style={{ color: grayToUse }}>
            {menu.description}
          </p>
        </div>

        <div className="px-4 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar item do cardápio..."
            className="w-full py-2 px-4 rounded-full border outline-none"
            style={{
              backgroundColor: translucidToUse,
              color: foregroundToUse,
              borderColor: translucidToUse,
            }}
          />
        </div>

        <LoyaltyBanner
          loyalty={menu.loyalty}
          menuId={menu.id}
          slug={menu.slug}
          className="px-4 mb-4"
          colors={{ text: foregroundToUse, muted: grayToUse, track: translucidToUse, accent: menu.details_color }}
        />

        <CategoryNav m={m} />

        {totalVisibleItems === 0 && (
          <div className="text-center py-8">
            <p style={{ color: grayToUse }}>Nenhum item encontrado.</p>
          </div>
        )}

        {/* Lista */}
        <div className="space-y-4 px-4">
          {/* Destaques */}
          {hasStarred && hasPlusPermissions && searchTerm === "" && (
            <div className="py-6 px-" id="starred-section">
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

          {filteredCategories.map((cat) => {
            const visibleItems = (cat.menu_items || []).filter((it) => it.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={cat.id} id={cat.id.slice(0, 5)} className="rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-wrap pt-6">
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {visibleItems.map((it) => (
                    <div key={it.id} className="flex items-stretch">
                      <div
                        className="flex-1 min-h-[130px] rounded-2xl p-3 flex flex-col justify-between cursor-pointer"
                        style={{ backgroundColor: translucidToUse }}
                        onClick={() => handleItemClick(it)}
                      >
                        <div className="flex gap-2">
                          {isSafeImageUrl(it.thumb_url || it.image_url) && (
                            <div className="w-[72px] h-[72px] shrink-0 overflow-hidden rounded-xl">
                              <Image
                                src={
                                  it.thumb_url || supabaseImg(it.image_url, { width: 120, height: 120, quality: 80 })
                                }
                                alt={it.name}
                                width={72}
                                height={72}
                                className="object-cover w-full h-full"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-xl line-clamp-1" style={{ color: foregroundToUse }}>
                              {it.name}
                            </div>

                            <div
                              className="text-sm line-clamp-2"
                              style={{ color: grayToUse, wordBreak: "normal", overflowWrap: "anywhere" }}
                            >
                              {it.description?.replace(/,\s*/g, ", ")}
                            </div>

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
                          </div>
                        </div>

                        <div className="flex items-end justify-between mt-2">
                          {/* preço */}
                          {it.promo_price && canShowPromoPrice ? (
                            <div>
                              <span className="text-xs xs:text-sm line-through" style={{ color: grayToUse }}>
                                {formatCurrency(it.price, menu?.currency)}
                              </span>
                              <div className="font-bold text-xl lg:text-2xl" style={{ color: foregroundToUse }}>
                                {formatCurrency(it.promo_price, menu?.currency)}
                              </div>
                            </div>
                          ) : (
                            <div className="font-bold text-2xl" style={{ color: foregroundToUse }}>
                              {it.variations?.options?.length > 0 && <span className="block text-xs font-normal">a partir de</span>}
                              {formatCurrency(it.price, menu?.currency)}
                            </div>
                          )}

                          <div className="px-6 py-2 rounded-full" style={{ backgroundColor: menu.details_color }}>
                            <FaShoppingCart style={{ color: getContrastTextColor(menu.details_color) }} />
                          </div>
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

      <MenuShell m={m} ownerPhone={ownerPhone} ownerRole={ownerRole} />
    </>
  );
}
