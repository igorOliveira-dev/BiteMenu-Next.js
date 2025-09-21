// app/menu/[slug]/page.jsx
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import NotFoundMenu from "../NotFoundMenu";

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

  if (!menu) {
    return <NotFoundMenu />;
  }

  return (
    <div className="min-h-screen w-full p-4 lg:px-32" style={{ backgroundColor: menu.background_color }}>
      {menu.banner_url && (
        <div className="relative w-full h-[25dvh]">
          <Image alt="Banner do estabelecimento" src={menu.banner_url} fill className="object-cover" priority unoptimized />
        </div>
      )}

      <div className="flex items-center mt-2">
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

      <p className="mt-1" style={{ color: getContrastTextColor(menu.background_color) }}>
        {menu.description}
      </p>

      {menu.categories?.map((cat) => (
        <div key={cat.id} className="mt-6">
          <h2 className="text-xl font-semibold" style={{ color: menu.title_color }}>
            {cat.name}
          </h2>
          <ul className="mt-2 space-y-2">
            {cat.menu_items?.map((item) => (
              <li key={item.id} className="border-b pb-2" style={{ borderColor: menu.details_color }}>
                <div className="flex justify-between">
                  <span style={{ color: menu.title_color }}>{item.name}</span>
                  <span style={{ color: menu.details_color }}>R$ {item.price.toFixed(2)}</span>
                </div>
                {item.description && (
                  <p className="text-sm" style={{ color: menu.details_color }}>
                    {item.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
