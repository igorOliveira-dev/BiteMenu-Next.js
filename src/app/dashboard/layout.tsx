import type { Metadata } from "next";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bitemenu.com.br"),

  title: "Dashboard | Bite Menu",
  description:
    "Gerencie seu cardápio digital no Bite Menu. Atualize produtos, personalize seu menu e acompanhe o desempenho do seu restaurante em um só lugar.",

  alternates: {
    canonical: "https://www.bitemenu.com.br/dashboard",
  },

  applicationName: "Bite Menu",

  robots: {
    index: false,
    follow: false,
  },

  openGraph: {
    title: "Dashboard | Bite Menu",
    description: "Área exclusiva para gerenciar seu cardápio digital no Bite Menu.",
    url: "https://www.bitemenu.com.br/dashboard",
    siteName: "Bite Menu",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Dashboard | Bite Menu",
    description: "Gerencie seu cardápio digital com praticidade no Bite Menu.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
