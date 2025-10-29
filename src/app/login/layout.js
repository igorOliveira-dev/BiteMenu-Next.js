import React from "react";

export const metadata = {
  metadataBase: new URL("https://www.bitemenu.com.br"),
  title: "Entrar | Bite Menu",
  description: "Acesse sua conta do Bite Menu e edite seu cardápio digital.",
  alternates: { canonical: "https://www.bitemenu.com.br/login" },
  openGraph: {
    title: "Entrar | Bite Menu",
    description: "Acesse sua conta do Bite Menu e edite seu cardápio digital.",
    url: "https://www.bitemenu.com.br/login",
    siteName: "Bite Menu",
  },
};

export default function layout({ children }) {
  return <div>{children}</div>;
}
