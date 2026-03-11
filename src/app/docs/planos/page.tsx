import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Planos - Bite Menu",
  description: "Guias completos, perguntas frequentes e instruções para usar o Bite Menu e criar seu cardápio digital.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/docs/planos",
  },

  openGraph: {
    title: "Planos - Bite Menu",
    description: "Aprenda a usar o Bite Menu com nossos guias e FAQs.",
    url: "https://www.bitemenu.com.br/docs/planos",
    siteName: "Bite Menu",
    type: "website",
  },
};

const page = () => {
  return (
    <div>
      <h1 className="default-h1">Planos</h1>

      <nav className="my-2">
        <Link className="underline text-blue-500 hover:text-blue-700" href="#o-que-sao-os-planos">
          O que são os planos?
        </Link>
        {" - "}
        <Link className="underline text-blue-500 hover:text-blue-700" href="#plus">
          Plano Plus
        </Link>
        {" - "}
        <Link className="underline text-blue-500 hover:text-blue-700" href="#pro">
          Plano Pro
        </Link>
      </nav>
    </div>
  );
};

export default page;
