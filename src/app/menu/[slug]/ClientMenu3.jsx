"use client";

import { FaMapMarkerAlt, FaPlus, FaShoppingCart, FaWhatsapp } from "react-icons/fa";
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

export default function ClientMenu3({ menu: rawMenu, ownerPhone, ownerRole, demoTheme = false }) {
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

  const background = menu.background_color;
  const accentColor = menu.details_color;
  const accentContrast = getContrastTextColor(accentColor);

  return (
    <>
      <div className="min-h-screen w-full relative pb-18" style={{ backgroundColor: background }}>
        {/* Header dark com banner ou gradiente */}
        <div className={`relative w-full ${BANNER_ASPECT_CLASS} overflow-hidden`}>
          {isSafeImageUrl(menu.banner_url) ? (
            <>
              <BannerImage
                desktop={supabaseImg(menu.banner_url, { quality: 70 })}
                mobile={isSafeImageUrl(menu.banner_mobile_url) ? supabaseImg(menu.banner_mobile_url, { quality: 70 }) : null}
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to bottom, ${background}00 0%, ${background} 100%)` }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${background} 0%, ${background} 100%)` }}
            />
          )}

          {/* Conteúdo do header sobre o banner */}
          <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-8 lg:px-20 xl:px-32">
            <div className="flex items-center gap-3">
              {isSafeImageUrl(menu.logo_url) && (
                <Image
                  alt="Logo do estabelecimento"
                  src={supabaseImg(menu.logo_url, { width: 200, height: 200, quality: 80 })}
                  width={88}
                  height={88}
                  className="w-[64px] h-[64px] sm:w-[88px] sm:h-[88px] object-cover rounded-xl border shrink-0"
                  loading="lazy"
                />
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: menu.title_color || foregroundToUse }}>
                {menu.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex justify-between px-4 sm:px-8 lg:px-20 xl:px-32 pt-3">
          <div>
            <div
              className=" cursor-pointer flex items-center mr-2 rounded-lg text-sm z-2 mb-2"
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
                className="flex gap-2 items-center text-sm hover:underline"
                style={{ color: grayToUse }}
              >
                <FaMapMarkerAlt size={10} /> {menu.address}
              </a>
            )}

            {menu.description && (
              <p className=" text-sm" style={{ color: grayToUse }}>
                {menu.description}
              </p>
            )}
          </div>

          <button
            style={{ color: foregroundToUse }}
            onClick={() => window.open(`https://wa.me/${ownerPhone ?? null}`, "_blank")}
          >
            <FaWhatsapp size={20} />
          </button>
        </div>

        {/* Busca */}
        <div className="px-4 sm:px-8 lg:px-20 xl:px-32 mt-4 mb-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar item..."
            className="w-full py-2 px-4 rounded-full outline-none text-sm"
            style={{
              backgroundColor: translucidToUse,
              color: foregroundToUse,
            }}
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
          {/* Destaques — carrossel com cards grandes */}
          {hasStarred && hasPlusPermissions && searchTerm === "" && (
            <div className="py-5" id="starred-section">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: foregroundToUse }}>
                Destaques
              </p>
              <div
                className="flex gap-3 overflow-x-auto pb-2 starred-scroll"
                style={{
                  scrollSnapType: "x mandatory",
                  "--scrollbar-color": menu.details_color,
                }}
              >
                {starredItems.map((it) => (
                  <div
                    key={it.id}
                    className="shrink-0 basis-[65%] xs:basis-[45%] sm:basis-[34%] md:basis-[27%] xl:basis-[22.5%] snap-start cursor-pointer rounded-2xl overflow-hidden relative"
                    style={{ backgroundColor: translucidToUse }}
                    onClick={() => handleItemClick(it)}
                  >
                    {isSafeImageUrl(it.image_url) && (
                      <div className="w-full aspect-square overflow-hidden">
                        <Image
                          src={supabaseImg(it.image_url, { width: 400, height: 400, quality: 75 })}
                          alt={it.name}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-2.5">
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
                        <div>
                          <span className="text-[11px] line-through" style={{ color: grayToUse }}>
                            {formatCurrency(it.price, menu?.currency)}
                          </span>
                          <p className="font-bold text-sm" style={{ color: foregroundToUse }}>
                            {formatCurrency(it.promo_price, menu?.currency)}
                          </p>
                        </div>
                      ) : (
                        <p className="font-bold text-sm mt-1" style={{ color: foregroundToUse }}>
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

          <div className="space-y-6 pb-6">
            {filteredCategories.map((cat) => {
              const visibleItems = (cat.menu_items || []).filter((it) => it.visible);
              if (visibleItems.length === 0) return null;

              return (
                <div key={cat.id} id={cat.id.slice(0, 5)}>
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

                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
                    {visibleItems.map((it) => (
                      <div
                        key={it.id}
                        className="rounded-2xl overflow-hidden cursor-pointer flex flex-col"
                        style={{ backgroundColor: translucidToUse, border: "1px solid rgba(255,255,255,0.07)" }}
                        onClick={() => handleItemClick(it)}
                      >
                        {/* Imagem quadrada no topo */}
                        {isSafeImageUrl(it.image_url) ? (
                          <div className="w-full aspect-square overflow-hidden">
                            <Image
                              src={supabaseImg(it.image_url, { width: 400, height: 400, quality: 75 })}
                              alt={it.name}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-full aspect-square flex items-center justify-center"
                            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                          >
                            <FaShoppingCart size={24} style={{ color: grayToUse }} />
                          </div>
                        )}

                        {/* Informações */}
                        <div className="p-2.5 flex flex-col flex-1 justify-between">
                          <div>
                            <p
                              className="font-semibold text-sm line-clamp-1 leading-snug"
                              style={{ color: foregroundToUse }}
                            >
                              {it.name}
                            </p>
                            {it.description && (
                              <p
                                className="text-[11px] line-clamp-2 mt-0.5 leading-relaxed"
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
                          </div>

                          <div className="flex items-end justify-between mt-2">
                            <div>
                              {it.promo_price && canShowPromoPrice ? (
                                <>
                                  <p className="text-[10px] line-through leading-none" style={{ color: grayToUse }}>
                                    {formatCurrency(it.price, menu?.currency)}
                                  </p>
                                  <p className="font-bold text-base leading-tight" style={{ color: foregroundToUse }}>
                                    {formatCurrency(it.promo_price, menu?.currency)}
                                  </p>
                                </>
                              ) : (
                                <p className="font-bold text-base leading-tight" style={{ color: foregroundToUse }}>
                                  {it.variations?.options?.length > 0 && <span className="block text-xs font-normal">a partir de</span>}
                                  {formatCurrency(it.price, menu?.currency)}
                                </p>
                              )}
                            </div>
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: accentColor }}
                            >
                              <FaPlus size={11} style={{ color: accentContrast }} />
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
      </div>

      <MenuShell m={m} ownerPhone={ownerPhone} ownerRole={ownerRole} />
    </>
  );
}
