import NotFoundMenu from "../../NotFoundMenu";
import ClientMenu from "../ClientMenu";
import ClientMenu2 from "../ClientMenu2";
import ClientMenu3 from "../ClientMenu3";
import { CartProvider } from "@/contexts/CartContext";
import { getMenuBySlug, getOwnerInfo, getOptionStock } from "../getMenuData";
import { applyStock, hideHiddenGroups, STOCK_ROLES } from "@/lib/stock";
import AiDraftPreview from "./AiDraftPreview";

// Uso interno: pré-visualização de layout a partir do dashboard (ConfigMenu.jsx).
// Fica fora de /menu/[slug] para não forçar renderização dinâmica na rota pública.
export const dynamic = "force-dynamic";

export default async function MenuPreviewPage({ params, searchParams }) {
  const { slug } = await params;
  const { preview_layout, ai_draft } = (await searchParams) ?? {};

  const rawMenu = await getMenuBySlug(slug);

  if (!rawMenu) return <NotFoundMenu />;

  const { ownerPhone, ownerRole } = await getOwnerInfo(rawMenu);
  const optionStock = STOCK_ROLES.includes(ownerRole) ? await getOptionStock(rawMenu.id) : [];
  const menu = applyStock(hideHiddenGroups(rawMenu), ownerRole, optionStock);

  const effectiveLayout = preview_layout || menu.layout;

  // proposta do assistente de IA (dashboard): aplicada só na tela
  if (ai_draft) {
    return (
      <CartProvider>
        <AiDraftPreview menu={menu} ownerPhone={ownerPhone} ownerRole={ownerRole} />
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      {effectiveLayout === "default" ? (
        <ClientMenu
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
        />
      ) : effectiveLayout === "list" ? (
        <ClientMenu2
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
        />
      ) : effectiveLayout === "grid" ? (
        <ClientMenu3
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
        />
      ) : (
        <ClientMenu
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
        />
      )}
    </CartProvider>
  );
}
