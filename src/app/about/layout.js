import React from "react";

export const metadata = {
  metadataBase: new URL("https://www.bitemenu.com.br"),
  title: "Sobre | Bite Menu",
  description:
    "Bite Menu é um site de criação de cardápios digitáis rápido, prático, funcional e presonalizável. Crie seu cardápio digital e controle pedidos e vendas pelo site.",
  alternates: { canonical: "https://www.bitemenu.com.br/about" },
  openGraph: {
    title: "Sobre | Bite Menu",
    description:
      "Bite Menu é um site de criação de cardápios digitáis rápido, prático, funcional e presonalizável. Crie seu cardápio digital e controle pedidos e vendas pelo site.",
    url: "https://www.bitemenu.com.br/about",
    siteName: "Bite Menu",
  },
};

export default function layout({ children }) {
  return <div>{children}</div>;
}
