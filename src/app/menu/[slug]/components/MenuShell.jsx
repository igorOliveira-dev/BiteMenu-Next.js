"use client";

// Partes iguais nos 3 layouts do cardápio: barra de categorias, botão do carrinho, modais, carrinho e footer.
// Recebe `m`, o retorno de useClientMenu.
import { FaMinus, FaPlus, FaShoppingCart } from "react-icons/fa";
import Image from "next/image";
import GenericModal from "@/components/GenericModal";
import XButton from "@/components/XButton";
import { formatCurrency } from "@/lib/formatCurrency";
import { supabaseImg } from "@/lib/imageUtils";
import { dayNames, formatOffset, splitRanges } from "@/utils/storeHours";
import { getContrastTextColor } from "@/utils/color";
import { isSafeImageUrl, scrollToCategoryId } from "../useClientMenu";
import CartDrawer from "./CartDrawer";
import AiAttendant from "./AiAttendant";
import VariationPicker from "./VariationPicker";
import MenuFooter from "./MenuFooter";

function formatHours(hours, toViewer) {
  if (!hours) return [];
  return Object.entries(dayNames).map(([key, label]) => {
    const ranges = splitRanges(hours[key]);
    if (!ranges.length) return { day: label, hours: "Fechado" };
    return { day: label, hours: ranges.map(([open, close]) => `${toViewer(open)} às ${toViewer(close)}`).join(" · ") };
  });
}

export function CategoryNav({ m, className = "" }) {
  const { menu, navCategories, hasStarred, hasPlusPermissions, translucidToUse, foregroundToUse } = m;
  if (navCategories.length === 0) return null;

  const btn =
    "cursor-pointer rounded-xl border border-[var(--nav-hover)] bg-[var(--nav-glass)] backdrop-blur-sm px-4 py-2.5 transition-colors hover:bg-[var(--nav-hover)]";

  return (
    <div
      className={`flex gap-1 px-2 py-2 sticky -top-1 border-y overflow-x-auto whitespace-nowrap scrollbar-none z-10 ${className}`}
      style={{
        backgroundColor: menu.background_color,
        borderColor: translucidToUse,
        color: foregroundToUse,
        "--nav-hover": translucidToUse, // hover dos itens no tom do dono, como a barra lateral do painel
        "--nav-glass": `${translucidToUse.slice(0, 7)}0d`, // vidro leve: mesmo tom com ~5% de opacidade
      }}
    >
      {hasStarred && hasPlusPermissions && (
        <button
          className={`${btn} font-semibold`}
          onClick={(e) => {
            e.preventDefault();
            scrollToCategoryId("starred-section", 40);
          }}
        >
          Destaques
        </button>
      )}

      {navCategories.map((cat) => (
        <div key={cat.id}>
          <button
            className={btn}
            onClick={(e) => {
              e.preventDefault();
              scrollToCategoryId(cat.id.slice(0, 5), 40);
            }}
          >
            {cat.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function MenuShell({ m, ownerPhone, ownerRole }) {
  const {
    menu,
    cart,
    combos,
    translucidToUse,
    grayToUse,
    foregroundToUse,
    open,
    todayKey,
    tzDiff,
    viewerOffset,
    toViewer,
    hoursModalOpen,
    closeHoursModal,
    canShowPromoPrice,
    itemModalOpen,
    selectedItem,
    closeItemModal,
    quantity,
    setQuantity,
    selectedOptions,
    toggleOptionChoice,
    selectedVariation,
    setSelectedVariation,
    note,
    setNote,
    totalPrice,
    handleAddToCart,
    descRef,
    showFade,
    imagePreviewOpen,
    imagePreviewVisible,
    openImagePreview,
    closeImagePreview,
    cartOpen,
    setCartOpen,
    openCart,
    closeCartProgrammatically,
    animateCart,
    checkoutSignal,
    setCheckoutSignal,
  } = m;

  return (
    <>
      {/* Botão Carrinho */}
      {menu.orders === "whatsapp" || menu.orders === "site_whatsapp" ? (
        <div
          id="cart-button-wrapper"
          style={{
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: 40,
            transition: "bottom 0.2s ease-in-out",
          }}
          className="flex items-center gap-2"
        >
          {menu.attendant_enabled === true && (
            <AiAttendant
              menu={menu}
              ownerRole={ownerRole}
              canShowPromoPrice={canShowPromoPrice}
              storeOpen={open}
              onOpenCart={openCart}
              onCheckout={() => {
                openCart();
                setCheckoutSignal((n) => n + 1);
              }}
              bgColor={menu.background_color}
              foreground={foregroundToUse}
              gray={grayToUse}
              translucid={translucidToUse}
            />
          )}
          <button
            onClick={openCart}
            className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-transform duration-200 hover:opacity-90 ${
              animateCart ? "scale-110" : "scale-100"
            }`}
            style={{ backgroundColor: menu.details_color, color: getContrastTextColor(menu.details_color) }}
            aria-label="Abrir carrinho"
          >
            <span>Carrinho</span>
            <FaShoppingCart />
            <span>{typeof cart.totalItems === "function" ? cart.totalItems(menu?.id) : 0}</span>
          </button>
        </div>
      ) : null}

      {/* Modal Horários */}
      {hoursModalOpen && (
        <GenericModal
          title="Horários de funcionamento:"
          titleColor={foregroundToUse}
          hoverXButtonColor={translucidToUse}
          wfull
          maxWidth={"480px"}
          bgColor={menu.background_color}
          onClose={closeHoursModal}
        >
          <div className="space-y-2" style={{ color: foregroundToUse }}>
            {tzDiff ? (
              <p className="px-2 text-xs opacity-70">Horários no seu fuso ({formatOffset(viewerOffset)})</p>
            ) : null}
            {formatHours(menu.hours, toViewer).map(({ day, hours }, idx) => {
              const dayKey = Object.keys(dayNames)[idx];
              const isToday = dayKey === todayKey;
              return (
                <div
                  key={day}
                  className="flex justify-between gap-3 px-3 py-1 rounded-lg"
                  style={{ backgroundColor: isToday ? translucidToUse : "transparent" }}
                >
                  <span>{day}:</span>
                  <span className="text-right">{hours}</span>
                </div>
              );
            })}
          </div>
        </GenericModal>
      )}

      {/* Modal Produto */}
      {itemModalOpen && selectedItem && (
        <GenericModal
          onClose={closeItemModal}
          title={selectedItem.name}
          titleColor={foregroundToUse}
          hoverXButtonColor={translucidToUse}
          bgColor={menu.background_color}
          maxWidth={"580px"}
          margin={"12px"}
          wfull
        >
          <div className="flex flex-col gap-4 sm:min-w-[460px] max-h-[70dvh] overflow-auto scrollbar-none">
            <div className="flex flex-row gap-4 mb-2">
              {isSafeImageUrl(selectedItem.image_url) && (
                <button
                  type="button"
                  onClick={openImagePreview}
                  className="h-26 w-26 sm:h-30 sm:w-30 overflow-hidden rounded-xl cursor-zoom-in hover:opacity-95 transition"
                  style={{ flexShrink: 0 }}
                  aria-label="Ampliar imagem do produto"
                >
                  <Image
                    src={supabaseImg(selectedItem.image_url, { width: 240, height: 240, quality: 80 })}
                    alt={selectedItem.name}
                    width={120}
                    height={120}
                    className="object-cover w-full h-full"
                  />
                </button>
              )}

              <div
                className={`flex flex-col gap-2 justify-between ${selectedItem.image_url ? "w-[calc(100%-120px)]" : "w-[100%]"}`}
              >
                <div className="relative">
                  {selectedItem.description && (
                    <>
                      <p
                        ref={descRef}
                        className="min-h-[64px] max-h-[64px] sm:min-h-[80px] sm:max-h-[80px] overflow-auto text-sm pr-1"
                        style={{
                          color: grayToUse,
                          wordBreak: "normal",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {selectedItem.description?.replace(/,\s*/g, ", ")}
                      </p>

                      <div
                        className="pointer-events-none absolute bottom-0 left-0 w-full h-6 transition-opacity duration-200"
                        style={{
                          opacity: showFade ? 1 : 0,
                          background: `linear-gradient(to top, ${menu.background_color}, ${menu.background_color}00)`,
                        }}
                      />
                    </>
                  )}
                </div>

                {selectedItem.promo_price && canShowPromoPrice ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold line-through" style={{ color: grayToUse }}>
                      {formatCurrency(selectedItem.price, menu?.currency)}
                    </span>
                    <span className="text-2xl font-semibold" style={{ color: foregroundToUse }}>
                      {formatCurrency(selectedItem.promo_price, menu?.currency)}
                    </span>
                  </div>
                ) : (
                  <>
                    {selectedItem.price ? (
                      <span className="text-3xl font-semibold" style={{ color: foregroundToUse }}>
                        {selectedItem.variations?.options?.[selectedVariation] ? (
                          formatCurrency(selectedItem.variations.options[selectedVariation].price, menu?.currency)
                        ) : (
                          <>
                            {selectedItem.variations?.options?.length > 0 && <><span className="text-sm font-normal">a partir de </span><br /></>}
                            {formatCurrency(selectedItem.price, menu?.currency)}
                          </>
                        )}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            {menu.orders !== "none" ? (
              <div className="max-w-full">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-[100%] h-full p-3 border rounded-xl outline-none"
                  style={{ backgroundColor: translucidToUse, color: foregroundToUse, borderColor: grayToUse }}
                  placeholder="Comentário (opicional)"
                />
              </div>
            ) : null}

            {menu.orders === "none" && (
              <VariationPicker
                variations={selectedItem.variations}
                selected={selectedVariation}
                currency={menu?.currency}
                accent={menu.details_color}
                foreground={foregroundToUse}
                gray={grayToUse}
                translucid={translucidToUse}
              />
            )}

            {menu.orders === "none" &&
            Array.isArray(selectedItem.option_groups) &&
            selectedItem.option_groups.length > 0 ? (
              <div className="space-y-3">
                {selectedItem.option_groups.map((g) => (
                  <div key={g.id}>
                    <p className="font-bold">{g.name}:</p>
                    {(g.option_choices || [])
                      .filter((c) => !c.hidden)
                      .map((c, idx, arr) => (
                        <span key={c.id}>
                          {c.name}
                          {idx < arr.length - 1 && ", "}
                        </span>
                      ))}
                  </div>
                ))}
              </div>
            ) : null}

            {menu.orders !== "none" ? (
              <>
                <VariationPicker
                  variations={selectedItem.variations}
                  selected={selectedVariation}
                  onSelect={setSelectedVariation}
                  currency={menu?.currency}
                  accent={menu.details_color}
                  foreground={foregroundToUse}
                  gray={grayToUse}
                  translucid={translucidToUse}
                />
                {Array.isArray(selectedItem.option_groups) && selectedItem.option_groups.length > 0 && (
                  <div className="space-y-4 mb-2">
                    {selectedItem.option_groups.map((g) => {
                      const min = Number(g.min_choices ?? 0);
                      const max = Number(g.max_choices ?? 0);
                      const selectedIds = selectedOptions[g.id] || [];

                      return (
                        <div key={g.id} className="space-y-2">
                          <div className="font-semibold flex items-center gap-2" style={{ color: foregroundToUse }}>
                            <span>{g.name}</span>
                            <span className="text-xs font-normal" style={{ color: grayToUse }}>
                              {min > 0 ? `mín. ${min}` : null}
                              {max > 0 ? ` · máx. ${max}` : null}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {(g.option_choices || [])
                              .filter((c) => !c.hidden)
                              .map((c) => {
                                const isSelected = selectedIds.includes(c.id);
                                const boxBg = isSelected ? "#16a34a44" : translucidToUse;

                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => toggleOptionChoice(g, c)}
                                    className="flex flex-col items-center justify-center rounded-full cursor-pointer px-4 py-2 min-w-[120px] text-center"
                                    style={{
                                      backgroundColor: boxBg,
                                      color: foregroundToUse,
                                      border: isSelected ? `1px solid #16a34a88` : "1px solid transparent",
                                    }}
                                  >
                                    <div className="font-medium truncate">
                                      {c.name}{" "}
                                      {Number(c.price) !== 0 && (
                                        <span className="text-sm" style={{ color: grayToUse }}>
                                          +{formatCurrency(c.price, menu?.currency)}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : null}
          </div>
          {menu.orders !== "none" && (
            <div className="flex xs:items-center flex-col xs:flex-row gap-4 justify-between mt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="cursor-pointer p-2 rounded-full border transition hover:opacity-70"
                  style={{ color: foregroundToUse, borderColor: grayToUse }}
                >
                  <FaMinus />
                </button>
                <span className="text-xl " style={{ color: foregroundToUse }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="cursor-pointer p-2 rounded-full border transition hover:opacity-70"
                  style={{ color: foregroundToUse, borderColor: grayToUse }}
                >
                  <FaPlus />
                </button>
                <span style={{ color: grayToUse }}>({formatCurrency(totalPrice, menu?.currency)})</span>
              </div>

              <button
                onClick={handleAddToCart}
                className="cursor-pointer py-2 px-5 gap-2 font-bold flex items-center justify-center rounded-full w-full xs:w-auto hover:opacity-90 transition"
                style={{ backgroundColor: menu.details_color, color: getContrastTextColor(menu.details_color) }}
              >
                <span>Adicionar {quantity} ao carrinho</span>
                <FaShoppingCart />
              </button>
            </div>
          )}
        </GenericModal>
      )}

      {imagePreviewOpen && selectedItem?.image_url && (
        <div
          onClick={closeImagePreview}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{
            backgroundColor: imagePreviewVisible ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0)",
            transition: "background-color 220ms ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              width: "min(88vw, 420px)",
              height: "min(88vw, 420px)",
              transform: imagePreviewVisible ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0.85)",
              opacity: imagePreviewVisible ? 1 : 0,
              transition: "transform 220ms ease, opacity 220ms ease",
            }}
          >
            <div
              onClick={closeImagePreview}
              className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-black/70 text-white text-xl flex items-center justify-center cursor-pointer"
              aria-label="Fechar imagem ampliada"
            >
              <XButton />
            </div>
            <button
              type="button"
              onClick={closeImagePreview}
              className="w-full h-full block rounded-2xl overflow-hidden cursor-zoom-out"
            >
              <Image
                src={supabaseImg(selectedItem.image_url, { width: 900, height: 900, quality: 85 })}
                alt={selectedItem.name}
                width={900}
                height={900}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      )}

      {/* Carrinho */}
      <CartDrawer
        menu={menu}
        combos={combos}
        open={cartOpen}
        onOpen={() => setCartOpen(true)}
        bgColor={menu.background_color}
        translucidToUse={translucidToUse}
        grayToUse={grayToUse}
        foregroundToUse={foregroundToUse}
        onClose={closeCartProgrammatically}
        isOpen={open}
        ownerPhone={ownerPhone}
        ownerRole={ownerRole}
        checkoutSignal={checkoutSignal}
      />

      <MenuFooter
        bgColor={menu.background_color}
        translucidToUse={translucidToUse}
        grayToUse={grayToUse}
        foregroundToUse={foregroundToUse}
      />
    </>
  );
}
