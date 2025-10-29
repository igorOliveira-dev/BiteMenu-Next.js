import React from "react";

export const metadata = {
  metadataBase: new URL("https://www.bitemenu.com.br"),
  title: "Registro | Bite Menu",
  description:
    "Crie sua conta no Bite Menu e aumente a presença online do seu estabelecimento com um cardápio digital prático e bonito.",
  alternates: { canonical: "https://www.bitemenu.com.br/register" },
  openGraph: {
    title: "Registro | Bite Menu",
    description:
      "Crie sua conta no Bite Menu e aumente a presença online do seu estabelecimento com um cardápio digital prático e bonito.",
    url: "https://www.bitemenu.com.br/register",
    siteName: "Bite Menu",
  },
};

export default function layout({ children }) {
  return <div>{children}</div>;
}
