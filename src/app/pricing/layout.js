import React from "react";

export const metadata = {
  metadataBase: new URL("https://www.bitemenu.com.br"),
  title: "Planos | Bite Menu",
  description:
    "Adquira agora o plano Plus ou Pro do Bite Menu para aumentar os produtos do seu cardápio digital e ganhar acesso à um incrível dashboard de vendas!",
  alternates: { canonical: "https://www.bitemenu.com.br/pricing" },
  openGraph: {
    title: "Planos | Bite Menu",
    description:
      "Adquira agora o plano Plus ou Pro do Bite Menu para aumentar os produtos do seu cardápio digital e ganhar acesso à um incrível dashboard de vendas!",
    url: "https://www.bitemenu.com.br/pricing",
    siteName: "Bite Menu",
  },
};

export default function layout({ children }) {
  return <div>{children}</div>;
}
