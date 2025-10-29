import React from "react";

export const metadata = {
  metadataBase: new URL("https://www.bitemenu.com.br"),
  title: "Política de privacidade | Bite Menu",
  description:
    "Fique por dentro da política de privacidade recente do Bite Menu para entender como coletamos e gerenciamos os seus dados.",
  alternates: { canonical: "https://www.bitemenu.com.br/politica-de-privacidade" },
  openGraph: {
    title: "Política de privacidade | Bite Menu",
    description:
      "Fique por dentro da política de privacidade recente do Bite Menu para entender como coletamos e gerenciamos os seus dados.",
    url: "https://www.bitemenu.com.br/politica-de-privacidade",
    siteName: "Bite Menu",
  },
};

export default function layout({ children }) {
  return <div>{children}</div>;
}
