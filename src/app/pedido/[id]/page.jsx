"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaReceipt } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import Loading from "@/components/Loading";
import BrandLogo from "@/components/BrandLogo";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Link do pedido na mensagem do WhatsApp. O banco decide quem é quem (open_order_link, tasks/acompanhar-pedido):
// dono/equipe vão pro pedido no painel, o cliente pra /conta (pedido feito sem login é vinculado à conta aqui).
export default function PedidoLinkPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading } = useUser();
  const [problem, setProblem] = useState(null);
  const valid = UUID.test(id);
  const back = encodeURIComponent(`/pedido/${id}`);

  useEffect(() => {
    if (loading || !user || !valid) return;
    supabase.rpc("open_order_link", { p_order_id: id }).then(({ data, error }) => {
      if (error) {
        console.warn("[pedido] link:", error.message);
        return setProblem("error");
      }
      const to = {
        owner: `/dashboard?tab=orders&pedido=${id}`,
        owner_sale: "/dashboard?tab=sales",
        staff: `/equipe?pedido=${id}`,
        customer: `/conta?aba=pedidos&pedido=${id}`,
      }[data];
      if (to) router.replace(to);
      else setProblem(data);
    });
  }, [loading, user, valid, id, router]);

  if (valid && (loading || (user && !problem))) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  const messages = {
    not_found: [
      "Pedido não encontrado",
      "Ele pode ter sido cancelado pelo estabelecimento. Em caso de dúvida, fale com eles pelo WhatsApp.",
    ],
    forbidden: [
      "Este pedido é de outra conta",
      "Entre com a conta usada no pedido para acompanhá-lo.",
    ],
    error: [
      "Não foi possível abrir o pedido",
      "Tente de novo em alguns instantes.",
    ],
  };
  const [title, text] = !valid
    ? messages.not_found
    : (messages[problem] ?? [
        "Acompanhe seu pedido",
        "Entre ou crie sua conta grátis para ver o andamento do pedido em tempo real e guardar seu histórico.",
      ]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-6">
      <div className="w-full max-w-[380px] space-y-5 rounded-2xl border border-brand-line bg-translucid p-6 text-center">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-2xl text-white">
          <FaReceipt />
        </span>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm color-gray">{text}</p>
        </div>

        {valid && !user ? (
          <div className="space-y-2">
            <Link
              href={`/register?tipo=cliente&next=${back}`}
              className="block w-full rounded-full bg-verde py-2 font-medium text-white hover:opacity-90"
            >
              Criar conta e acompanhar
            </Link>
            <Link
              href={`/login?tipo=cliente&next=${back}`}
              className="block w-full rounded-full border border-brand-line py-2 font-medium hover-bg-translucid"
            >
              Já tenho conta
            </Link>
          </div>
        ) : (
          <Link
            href={user ? "/conta?aba=pedidos" : "/"}
            className="block w-full rounded-full border border-brand-line py-2 font-medium hover-bg-translucid"
          >
            {user ? "Ver meus pedidos" : "Ir para o início"}
          </Link>
        )}
      </div>
    </div>
  );
}
