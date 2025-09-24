import { ConfirmProvider } from "@/providers/ConfirmProvider";
import "./globals.css";
import { AlertProvider } from "@/providers/AlertProvider";

export const metadata = {
  title: "Bite Menu - Crie seu cardápio digital",
  description:
    "Crie seu cardápio digital grátis com o Bite Menu. Simples, moderno e feito para restaurantes que querem vender mais e registrar pedidos com facilidade.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className={`antialiased`}>
        <ConfirmProvider>
          <AlertProvider>{children}</AlertProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
