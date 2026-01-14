"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      console.log("Session ID do Stripe:", sessionId);
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {loading ? (
        <p>Finalizando a compra...</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Compra realizada com sucesso!</h1>
          <p>Seu plano foi ativado. Você já pode usar todas as funcionalidades.</p>
          <a href="/dashboard" className="mt-4 px-4 py-2 bg-translucid rounded hover:opacity-80 transition">
            Ir para o Dashboard
          </a>
        </>
      )}
    </div>
  );
}
