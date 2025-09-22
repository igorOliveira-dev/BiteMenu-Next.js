// app/menu/[slug]/page.jsx
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import NotFoundMenu from "../NotFoundMenu";
import { FaPen, FaShoppingCart, FaTrash } from "react-icons/fa";

function getContrastTextColor(hex) {
  const cleanHex = (hex || DEFAULT_BACKGROUND).replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

export default async function MenuPage({ params }) {
  const slug = (await params).slug;
  const { data: menu } = await supabase
    .from("menus")
    .select(
      `
      id,
      title,
      description,
      banner_url,
      logo_url,
      background_color,
      title_color,
      details_color,
      categories (
        id,
        name,
        menu_items (
          id,
          name,
          description,
          price
        )
      )
    `
    )
    .eq("slug", slug)
    .single();

  const translucidToUse = getContrastTextColor(menu.background_color) === "white" ? "#ffffff15" : "#00000015";
  const grayToUse = getContrastTextColor(menu.background_color) === "white" ? "#cccccc" : "#333333";
  const foregroundToUse = getContrastTextColor(menu.background_color) === "white" ? "#fafafa" : "#171717";

  if (!menu) {
    return <NotFoundMenu />;
  }

  return (
    <div className="min-h-screen w-full lg:px-20 xl:px-32" style={{ backgroundColor: menu.background_color }}>
      {menu.banner_url && (
        <div className="relative w-full h-[25dvh]">
          <Image alt="Banner do estabelecimento" src={menu.banner_url} fill className="object-cover" priority unoptimized />
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
                    className="flex-1 flex flex-col items-start gap-2 p-2 rounded-lg"
                    style={{ backgroundColor: translucidToUse }}
                  >
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

                    <div className="flex items-center justify-between w-full">
                      <div className="text-2xl font-medium" style={{ color: foregroundToUse }}>
                        {it.price ? `R$ ${Number(it.price).toFixed(2)}` : "-"}
                      </div>
                      <div className="mr-2 px-6 py-2 rounded" style={{ backgroundColor: menu.details_color }}>
                        <FaShoppingCart style={{ color: getContrastTextColor(menu.details_color) }} />
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
  );
}
