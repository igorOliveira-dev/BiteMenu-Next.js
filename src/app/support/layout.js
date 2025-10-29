import React from "react";

export const metadata = {
  metadataBase: new URL("https://www.bitemenu.com.br"),
  title: "Suporte | Bite Menu",
  description: "Acesse o suporte do Bite Menu via WhatsApp.",
  alternates: { canonical: "https://www.bitemenu.com.br/support" },
  openGraph: {
    title: "Suporte | Bite Menu",
    description: "Acesse o suporte do Bite Menu via WhatsApp.",
    url: "https://www.bitemenu.com.br/support",
    siteName: "Bite Menu",
  },
};

export default function layout({ children }) {
  return <div>{children}</div>;
}
