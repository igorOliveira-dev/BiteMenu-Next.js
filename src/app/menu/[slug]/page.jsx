// app/menu/[slug]/page.jsx
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

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
    return <div>Cardápio não encontrado</div>;
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
          <div className="relative w-24 h-24 mr-4">
            <Image
              alt="Logo do estabelecimento"
              src={menu.logo_url}
              width={96}
              height={96}
              className="object-cover rounded-lg"
              priority
              unoptimized
            />
          </div>
        )}

        <h1 className="text-2xl font-bold" style={{ color: menu.title_color }}>
          {menu.title}
        </h1>
      </div>

      <p className="mt-1" style={{ color: menu.details_color }}>
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
