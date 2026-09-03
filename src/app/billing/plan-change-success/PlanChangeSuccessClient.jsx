"use client";
import { useSearchParams } from "next/navigation";

const formatDate = (timestamp) => {
  if (!timestamp) return null;
  return new Date(Number(timestamp) * 1000).toLocaleDateString("pt-BR");
};

export default function PlanChangeSuccessClient() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const plan = searchParams.get("plan") || "";
  const date = formatDate(searchParams.get("date"));
  const isBoleto = searchParams.get("payment_method") === "boleto";
  const invoiceUrl = searchParams.get("invoice_url");

  let title = "Plano atualizado!";
  let message = `Seu plano foi alterado para ${plan}. Você já pode usar todas as funcionalidades.`;

  if (type === "downgrade_scheduled") {
    title = "Troca de plano agendada!";
    message = `Você continua com os recursos do seu plano atual até ${
      date ?? "o fim do período já pago"
    }. A troca pro plano ${plan} entra em vigor na próxima renovação.`;
  } else if (type === "upgrade_pending") {
    title = isBoleto ? "Boleto gerado!" : "Pagamento em confirmação";
    message = isBoleto
      ? `Seu acesso ao plano ${plan} libera assim que o boleto for compensado (pode levar alguns dias).`
      : `Seu acesso ao plano ${plan} libera assim que o pagamento for aprovado.`;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 max-w-md">{message}</p>

      {invoiceUrl && (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-blue-500 hover:text-blue-700 underline transition"
        >
          Ver boleto
        </a>
      )}

      <a href="/dashboard" className="mt-4 px-4 py-2 bg-translucid rounded hover:opacity-80 transition">
        Ir para o Dashboard
      </a>
    </div>
  );
}
