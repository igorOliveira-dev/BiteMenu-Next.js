import NotFoundMenu from "../NotFoundMenu";
import ClientMenu from "./ClientMenu";
import { CartProvider } from "@/contexts/CartContext";
import ClientMenu2 from "./ClientMenu2";
import ClientMenu3 from "./ClientMenu3";
import { getMenuBySlug, getOwnerInfo, getOptionStock } from "./getMenuData";
import { applyStock, hideHiddenGroups, STOCK_ROLES } from "@/lib/stock";

export const revalidate = 300; // 5 minutos — cardápios raramente mudam em alta frequência

// Sem isto a rota é renderizada a cada visita e o revalidate acima não vale:
// lista vazia = nada no build, cada slug é gerado na 1ª visita e fica em cache (ISR)
export async function generateStaticParams() {
  return [];
}

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

// Restaurant + Menu (schema.org): deixa o cardápio legível por buscadores e IAs.
// Só itens visíveis; "<" escapado porque os textos vêm do dono do cardápio.
function buildMenuJsonLd(menu, slug) {
  const currency = menu.currency || "BRL";
  const sections = (menu.categories || [])
    .map((cat) => ({
      "@type": "MenuSection",
      name: cat.name,
      hasMenuItem: (cat.menu_items || [])
        .filter((it) => it.visible)
        .map((it) => ({
          "@type": "MenuItem",
          name: it.name,
          ...(it.description && { description: it.description }),
          ...(it.image_url && { image: it.image_url }),
          ...(it.price != null && {
            offers: { "@type": "Offer", price: it.price, priceCurrency: currency },
          }),
        })),
    }))
    .filter((section) => section.hasMenuItem.length > 0);

  const data = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: menu.title,
    url: `https://www.bitemenu.com.br/menu/${slug}`,
    ...(menu.description && { description: menu.description }),
    ...(menu.address && { address: menu.address }),
    ...((menu.logo_url || menu.banner_url) && { image: menu.logo_url || menu.banner_url }),
    hasMenu: { "@type": "Menu", hasMenuSection: sections },
  };

  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Página principal (server component)
// Não lê searchParams: manter isso fora daqui é o que permite o ISR (revalidate acima)
// funcionar de fato — ler searchParams força a rota inteira a renderizar dinamicamente
// por request. O preview de layout (?preview_layout=) vive em /menu/[slug]/preview.
export default async function MenuPage({ params }) {
  const { slug } = await params;

  const rawMenu = await getMenuBySlug(slug);

  if (!rawMenu) return <NotFoundMenu />;

  const { ownerPhone, ownerRole, deletionRequested } = await getOwnerInfo(rawMenu);
  // dono pediu exclusão da conta: cardápio sai do ar até a exclusão manual
  if (deletionRequested) return <NotFoundMenu />;

  const optionStock = STOCK_ROLES.includes(ownerRole) ? await getOptionStock(rawMenu.id) : [];
  const menu = applyStock(hideHiddenGroups(rawMenu), ownerRole, optionStock);

  const effectiveLayout = menu.layout;

  return (
    <CartProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildMenuJsonLd(menu, slug) }} />
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
