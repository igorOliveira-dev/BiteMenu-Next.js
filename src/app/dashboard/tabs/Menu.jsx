"use client";

import useMenu from "@/hooks/useMenu";
import Image from "next/image";

const Menu = () => {
  const { menu, loading } = useMenu();

  if (loading) return <></>;
  if (!menu) return <p>Você ainda não criou seu menu.</p>;

  return (
    <div
      className="m-4 md:m-auto lg:m-2 max-w-[768px] h-[800px] rounded-lg"
      style={{ backgroundColor: menu.background_color }}
    >
      {menu.banner_url ? (
        <div className="relative w-full max-w-full h-[25dvh]">
          <Image alt="Banner do estabelecimento" src={menu.banner_url} fill className="object-cover" priority />
        </div>
      ) : (
        <></>
      )}
      <div className="flex items-center py-4 px-4">
        {menu.logo_url ? (
          <div className="relative w-full max-w-[80px] aspect-[1/1]">
            <Image alt="Logo do estabelecimento" src={menu.logo_url} fill className="object-cover rounded-lg" priority />
          </div>
        ) : (
          <></>
        )}
        <h1 className={`text-md md:text-2xl font-bold ml-4`} style={{ color: menu.title_color }}>
          {menu.title}
        </h1>
      </div>
    </div>
  );
};

export default Menu;
