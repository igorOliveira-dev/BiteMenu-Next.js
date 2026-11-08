"use client";

// Layout personalizado (Enterprise, tasks/layout-personalizado/): blocos na ordem do dono, cada um com o próprio
// template/CSS. menu.custom_layout chega LIMPO (cleanLayout, src/lib/customLayout.js) do page.jsx ou da prévia.
// Carrinho, modais e pedido continuam os mesmos dos outros layouts (MenuShell).
import { Fragment, useMemo } from "react";
import { formatCurrency } from "@/lib/formatCurrency";
import { supabaseImg } from "@/lib/imageUtils";
import BannerImage, { BANNER_ASPECT_CLASS } from "@/components/BannerImage";
import { mapsUrl } from "@/components/AddressFields";
import { basePalette, emptyFields, fill, fontHref, layoutCss, sectionColors } from "@/lib/customLayout";
import LoyaltyBanner from "./components/LoyaltyBanner";
import MenuShell, { CategoryNav } from "./components/MenuShell";
import useClientMenu, { describeCombos, isSafeImageUrl } from "./useClientMenu";

// HTML do template já preenchido + data-empty (esconde os data-if de campos vazios)
const tplProps = (tpl, values) => ({ "data-empty": emptyFields(values), dangerouslySetInnerHTML: { __html: fill(tpl, values) } });

export default function ClientMenuCustom({ menu: rawMenu, ownerPhone, ownerRole, demoTheme = false }) {
  const m = useClientMenu(rawMenu, ownerRole, demoTheme);
  const {
    menu,
    openColor,
    closedColor,
    open,
    statusText,
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
    openCart,
  } = m;
  const layout = rawMenu.custom_layout;
  // paleta como regra CSS (não inline): o CSS geral do layout pode redefinir as variáveis --bm-*
  const css = useMemo(() => layoutCss(layout, basePalette(menu)), [layout, menu.background_color, menu.title_color, menu.details_color]);
  const currency = menu?.currency;

  const menuValues = {
    title: menu.title,
    description: menu.description,
    logo: isSafeImageUrl(menu.logo_url) ? supabaseImg(menu.logo_url, { width: 200, height: 200, quality: 80 }) : "",
    banner: isSafeImageUrl(menu.banner_url) ? supabaseImg(menu.banner_url, { quality: 70 }) : "",
    address: menu.address,
    maps: menu.address ? mapsUrl(menu.address) : "",
    whatsapp: ownerPhone ? `https://wa.me/${ownerPhone}` : "",
    status: statusText,
    status_color: open ? openColor : closedColor,
  };

  const itemValues = (it) => {
    const promo = it.promo_price && canShowPromoPrice;
    return {
      name: it.name,
      description: it.description?.replace(/,\s*/g, ", "),
      price: formatCurrency(promo ? it.promo_price : it.price, currency),
      old_price: promo ? formatCurrency(it.price, currency) : "",
      image: isSafeImageUrl(it.image_url) ? supabaseImg(it.image_url, { width: 400, height: 400, quality: 80 }) : "",
      combos: describeCombos(itemCombos[it.id], currency).join(" · "),
      from: it.variations?.options?.length > 0 && !promo ? "a partir de" : "",
    };
  };

  const renderItems = (b, items) => (
    <div className="bm-list">
      {items.map((it) => (
        <div
          key={it.id}
          className="bm-item"
          role="button"
          tabIndex={0}
          onClick={() => handleItemClick(it)}
          onKeyDown={(e) => e.key === "Enter" && handleItemClick(it)}
          {...tplProps(b.html, itemValues(it))}
        />
      ))}
    </div>
  );

  const renderBlock = (b) => {
    const cls = `bm-b-${b.id}`;
    switch (b.type) {
      case "banner":
        return isSafeImageUrl(menu.banner_url) ? (
          <div className={`${cls} bm-full relative w-full ${BANNER_ASPECT_CLASS}`}>
            <BannerImage
              desktop={supabaseImg(menu.banner_url, { quality: 70 })}
              mobile={isSafeImageUrl(menu.banner_mobile_url) ? supabaseImg(menu.banner_mobile_url, { quality: 70 }) : null}
            />
          </div>
        ) : null;
      case "header":
      case "html":
        return <div className={cls} {...tplProps(b.html, menuValues)} />;
      case "search":
        return (
          <div className={cls}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={b.placeholder || "Buscar item do cardápio..."}
              aria-label="Buscar no cardápio"
              className="bm-search w-full py-2 px-4 rounded-full border outline-none text-sm"
              style={{ backgroundColor: "var(--bm-line)", color: "var(--bm-text)", borderColor: "var(--bm-line)" }}
            />
          </div>
        );
      case "loyalty":
        return (
          <LoyaltyBanner
            loyalty={menu.loyalty}
            menuId={menu.id}
            slug={menu.slug}
            className={cls}
            colors={{ text: "var(--bm-text)", muted: "var(--bm-muted)", track: "var(--bm-line)", accent: "var(--bm-accent)" }}
          />
        );
      case "categories":
        // sem wrapper: o sticky da barra depende de ser filha direta da página. Cores pelas variáveis: seguem a paleta do layout
        return (
          <CategoryNav
            m={m}
            className={`${cls} bm-nav`}
            style={{
              backgroundColor: sectionColors(b.style)?.[0] ?? "var(--bm-bg)",
              color: sectionColors(b.style)?.[1] ?? (b.style.color || "var(--bm-text)"),
              borderColor: "var(--bm-line)",
              "--nav-hover": "var(--bm-line)",
              "--nav-glass": "transparent",
            }}
          />
        );
      case "starred":
        if (!hasStarred || !hasPlusPermissions || searchTerm !== "") return null;
        return (
          <div className={cls} id="starred-section">
            {b.title && <h2 className="bm-title-section">{b.title}</h2>}
            {renderItems(b, starredItems)}
          </div>
        );
      case "items":
        return (
          <div className={cls}>
            {totalVisibleItems === 0 && <p className="text-center py-8" style={{ color: "var(--bm-muted)" }}>Nenhum item encontrado.</p>}
            {filteredCategories.map((cat) => {
              const visible = (cat.menu_items || []).filter((it) => it.visible);
              if (!visible.length) return null;
              const catValues = { name: cat.name, combos: describeCombos(categoryCombos[cat.id], currency).join(" · ") };
              return (
                <section key={cat.id} id={cat.id.slice(0, 5)} className="bm-category">
                  <div {...tplProps(b.categoryHtml, catValues)} />
                  {renderItems(b, visible)}
                </section>
              );
            })}
          </div>
        );
      default:
        return null;
    }
  };

  // cliques dos templates sem JS: data-action="hours" | "cart"
  const onAction = (e) => {
    const action = e.target.closest?.("[data-action]")?.dataset.action;
    if (action === "hours") setHoursModalOpen(true);
    else if (action === "cart") openCart();
  };

  const href = fontHref(layout.font);

  return (
    <>
      {href && <link rel="stylesheet" href={href} precedence="default" />}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className="bm-custom min-h-screen w-full relative pb-18"
        onClick={onAction}
        style={{
          ...(href && { fontFamily: `"${layout.font}", sans-serif` }),
        }}
      >
        {layout.blocks.filter((b) => !b.hidden).map((b) => <Fragment key={b.id}>{renderBlock(b)}</Fragment>)}
      </div>

      <MenuShell m={m} ownerPhone={ownerPhone} ownerRole={ownerRole} />
    </>
  );
}
