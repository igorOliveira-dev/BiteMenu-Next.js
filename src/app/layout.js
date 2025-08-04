import { ConfirmProvider } from "@/providers/ConfirmProvider";
import "./globals.css";

export const metadata = {
  title: "Bite Menu - Crie seu cardápio digital",
  description:
    "Crie seu cardápio digital grátis com o Bite Menu. Simples, moderno e feito para restaurantes que querem vender mais e registrar pedidos com facilidade.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className={`antialiased`}>
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
