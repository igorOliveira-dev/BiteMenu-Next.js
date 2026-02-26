import { ConfirmProvider } from "@/providers/ConfirmProvider";
import "./globals.css";
import { AlertProvider } from "@/providers/AlertProvider";
import GA from "@/components/GA";
import logoMark from "../../public/LogoMarca-sem-fundo.png";
import PWAGuard from "./PWAGuard";

export const metadata = {
  metadataBase: new URL("https://www.bitemenu.com.br"),
  title: "Criar cardápio digital grátis | Bite Menu",
  description:
    "Crie seu cardápio digital grátis com o Bite Menu. Simples, moderno e feito para estabelecimentos que querem vender mais e registrar pedidos com facilidade.",
  alternates: { canonical: "https://www.bitemenu.com.br" },

  applicationName: "Bite Menu",
  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bite Menu",
  },

  formatDetection: {
    telephone: false,
  },

  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png" }],
  },

  openGraph: {
    title: "Crie seu cardápio digital grátis | Bite Menu",
    description:
      "Crie seu cardápio digital grátis com o Bite Menu. Simples, moderno e feito para estabelecimentos que querem vender mais e registrar pedidos com facilidade.",
    url: "https://www.bitemenu.com.br",
    siteName: "Bite Menu",
    images: [
      {
        url: logoMark.src,
        width: 1200,
        height: 630,
        alt: "Bite Menu",
      },
    ],
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className={`antialiased`}>
        <ConfirmProvider>
          <AlertProvider>
            <PWAGuard />
            {children}
            <GA />
          </AlertProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
