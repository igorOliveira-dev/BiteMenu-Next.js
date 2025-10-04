import { ConfirmProvider } from "@/providers/ConfirmProvider";
import "./globals.css";
import { AlertProvider } from "@/providers/AlertProvider";
import GA from "@/components/GA";

export const metadata = {
  title: "Bite Menu - Crie seu cardápio digital",
  description:
    "Crie seu cardápio digital grátis com o Bite Menu. Simples, moderno e feito para estabelecimentos que querem vender mais e registrar pedidos com facilidade.",
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
