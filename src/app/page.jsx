import React from "react";
import LandingPageV1 from "./landingPage/LandingPageV1";
import { plans } from "@/consts/Plans";

const BASE_URL = "https://www.bitemenu.com.br";

// Dados estruturados (schema.org): ajudam Google e IAs a entender e citar o produto
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Bite Menu",
      url: BASE_URL,
      logo: `${BASE_URL}/icon-512.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "Bite Menu",
      url: BASE_URL,
      inLanguage: "pt-BR",
      publisher: { "@id": `${BASE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "Bite Menu",
      url: BASE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      description:
        "Cardápio digital para restaurantes, lanchonetes e deliveries. Crie o cardápio grátis em minutos e receba pedidos pelo WhatsApp e por um painel de pedidos, sem taxa por venda.",
      publisher: { "@id": `${BASE_URL}/#organization` },
      offers: plans.map((plan) => ({
        "@type": "Offer",
        name: `Plano ${plan.name}`,
        price: plan.price.replace(",", "."),
        priceCurrency: "BRL",
        url: `${BASE_URL}/pricing`,
      })),
    },
  ],
};

const page = () => {
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPageV1 />
    </div>
  );
};

export default page;
