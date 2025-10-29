import React from "react";

export const metadata = {
  metadataBase: new URL("https://www.bitemenu.com.br"),
  title: "FAQs | Bite Menu",
  description: "Veja as respostas de perguntas frequentes sobre o Bite Menu, criador de cardápios digitais.",
  alternates: { canonical: "https://www.bitemenu.com.br/faqs" },
  openGraph: {
    title: "FAQs | Bite Menu",
    description: "Veja as respostas de perguntas frequentes sobre o Bite Menu, criador de cardápios digitais.",
    url: "https://www.bitemenu.com.br/faqs",
    siteName: "Bite Menu",
  },
};

export default function layout({ children }) {
  return <div>{children}</div>;
}
