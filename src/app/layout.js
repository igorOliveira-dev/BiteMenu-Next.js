import { ConfirmProvider } from "@/providers/ConfirmProvider";
import "./globals.css";
import { AlertProvider } from "@/providers/AlertProvider";
import GA from "@/components/GA";
import logoMark from "../../public/LogoMarca-sem-fundo.png";

export const metadata = {
  metadataBase: new URL("https://bitemenu.com.br"),
  title: "Bite Menu - Crie seu cardápio digital",
  description:
    "Crie seu cardápio digital grátis com o Bite Menu. Simples, moderno e feito para estabelecimentos que querem vender mais e registrar pedidos com facilidade.",
  alternates: { canonical: "https://bitemenu.com.br" },
  openGraph: {
    title: "Bite Menu - Crie seu cardápio digital",
    description:
      "Crie seu cardápio digital grátis com o Bite Menu. Simples, moderno e feito para estabelecimentos que querem vender mais e registrar pedidos com facilidade.",
    url: "https://bitemenu.com.br",
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

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className={`antialiased`}>
        <ConfirmProvider>
          <AlertProvider>
            {children}
            <GA />
          </AlertProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
