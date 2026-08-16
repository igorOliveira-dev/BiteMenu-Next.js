import NotFoundMenu from "../../NotFoundMenu";
import ClientMenu from "../ClientMenu";
import ClientMenu2 from "../ClientMenu2";
import ClientMenu3 from "../ClientMenu3";
import { CartProvider } from "@/contexts/CartContext";
import { getMenuBySlug, getOwnerInfo } from "../getMenuData";

// Uso interno: pré-visualização de layout a partir do dashboard (ConfigMenu.jsx).
// Fica fora de /menu/[slug] para não forçar renderização dinâmica na rota pública.
export const dynamic = "force-dynamic";

export default async function MenuPreviewPage({ params, searchParams }) {
  const { slug } = await params;
  const { preview_layout } = (await searchParams) ?? {};

  const menu = await getMenuBySlug(slug);

  if (!menu) return <NotFoundMenu />;

  const { ownerPhone, ownerRole, ownerStripeAccount, ownerCanUseStripeExpress } = await getOwnerInfo(menu);

  const effectiveLayout = preview_layout || menu.layout;

  return (
    <CartProvider>
      {effectiveLayout === "default" ? (
        <ClientMenu
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
          ownerStripeAccount={ownerStripeAccount}
          ownerCanUseStripeExpress={ownerCanUseStripeExpress}
        />
      ) : effectiveLayout === "list" ? (
        <ClientMenu2
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
          ownerStripeAccount={ownerStripeAccount}
          ownerCanUseStripeExpress={ownerCanUseStripeExpress}
        />
      ) : effectiveLayout === "grid" ? (
        <ClientMenu3
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
          ownerStripeAccount={ownerStripeAccount}
          ownerCanUseStripeExpress={ownerCanUseStripeExpress}
        />
      ) : (
        <ClientMenu
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
          ownerStripeAccount={ownerStripeAccount}
          ownerCanUseStripeExpress={ownerCanUseStripeExpress}
        />
      )}
    </CartProvider>
  );
}
