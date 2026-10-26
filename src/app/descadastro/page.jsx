"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import bitemenu from "../../../public/LogoMarca-sem-fundo.png";

// Descadastro dos e-mails de remarketing (link no rodapé dos e-mails). Pede confirmação com botão
// porque alguns provedores abrem os links do e-mail sozinhos pra checar segurança.
function Unsubscribe() {
  const params = useSearchParams();
  const [status, setStatus] = useState("idle");

  const confirm = async () => {
    setStatus("loading");
    const res = await fetch(`/api/remarketing/unsubscribe?u=${params.get("u")}&t=${params.get("t")}`, { method: "POST" });
    setStatus(res.ok ? "done" : "error");
  };

  return (
    <div className="w-[100dvw] h-[100dvh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-60 h-16 relative mb-6">
        <Image src={bitemenu} alt="Bite Menu" fill />
      </div>

      {status === "done" ? (
        <>
          <h1 className="default-h1 mb-2">Pronto, você foi descadastrado</h1>
          <p className="text-sm mb-4" style={{ color: "var(--gray)" }}>
            Você não vai mais receber nossas dicas por e-mail. Avisos da sua conta e do seu plano continuam chegando.
          </p>
        </>
      ) : (
        <>
          <h1 className="default-h1 mb-2">Não quer mais receber nossas dicas?</h1>
          <p className="text-sm mb-4" style={{ color: "var(--gray)" }}>
            Avisos da sua conta e do seu plano continuam chegando normalmente.
          </p>
          <button
            onClick={confirm}
            disabled={status === "loading"}
            className="text-white cursor-pointer bg-red-600/80 hover:bg-red-600 rounded-lg px-4 py-2 transition disabled:opacity-50 mb-4"
          >
            {status === "loading" ? "Descadastrando..." : "Confirmar descadastro"}
          </button>
          {status === "error" && <p className="text-sm text-red-500 mb-4">Link inválido ou expirado.</p>}
        </>
      )}

      <Link className="underline text-blue-500 hover:text-blue-700" href="/">
        Voltar à página inicial
      </Link>
    </div>
  );
}

export default function DescadastroPage() {
  return (
    <Suspense>
      <Unsubscribe />
    </Suspense>
  );
}
