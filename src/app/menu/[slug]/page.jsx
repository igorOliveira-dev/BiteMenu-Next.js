import NotFoundMenu from "../NotFoundMenu";
import ClientMenu from "./ClientMenu";
import { CartProvider } from "@/contexts/CartContext";
import ClientMenu2 from "./ClientMenu2";
import ClientMenu3 from "./ClientMenu3";
import { getMenuBySlug, getOwnerInfo } from "./getMenuData";

export const revalidate = 300; // 5 minutos — cardápios raramente mudam em alta frequência

// SEO dinâmico (server only)
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const menu = await getMenuBySlug(slug);

  if (!menu) {
    return {
      title: "Menu não encontrado - Bite Menu",
      description: "Este cardápio não existe ou foi removido.",
    };
  }

  const baseUrl = "https://www.bitemenu.com.br";
  const canonicalUrl = `${baseUrl}/menu/${slug}`;
  const imageUrl = menu.banner_url || menu.logo_url || `${baseUrl}/default-og.jpg`;
  const description = menu.description || "Confira este cardápio no Bite Menu.";

  return {
    title: `${menu.title} | Bite Menu`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: false,
    },
    openGraph: {
      title: menu.title,
      description,
      url: canonicalUrl,
      siteName: "Bite Menu",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Banner do cardápio ${menu.title}`,
        },
      ],
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: menu.title,
      description,
      images: [imageUrl],
    },
  };
}

// Página principal (server component)
// Não lê searchParams: manter isso fora daqui é o que permite o ISR (revalidate acima)
// funcionar de fato — ler searchParams força a rota inteira a renderizar dinamicamente
// por request. O preview de layout (?preview_layout=) vive em /menu/[slug]/preview.
export default async function MenuPage({ params }) {
  const { slug } = await params;

  const menu = await getMenuBySlug(slug);

  if (!menu) return <NotFoundMenu />;

  const { ownerPhone, ownerRole, ownerStripeAccount, ownerCanUseStripeExpress } = await getOwnerInfo(menu);

  const effectiveLayout = menu.layout;

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
