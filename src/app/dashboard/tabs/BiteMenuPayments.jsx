"use client";

import useUser from "@/hooks/useUser";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const BiteMenuPayments = () => {
  const { profile } = useUser();

  const searchParams = useSearchParams();

  useEffect(() => {
    const connectSuccess = searchParams.get("connect");

    if (connectSuccess === "success" && profile?.id) {
      syncConnectStatus();
    }
  }, [profile, searchParams]);

  const syncConnectStatus = async () => {
    if (!profile?.id) return;

    const response = await fetch("/api/connect/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: profile.id,
      }),
    });

    const data = await response.json();

    console.log(data);

    if (data.connected) {
      window.history.replaceState({}, "", "/dashboard?tab=biteMenuPayments");
      window.location.reload();
    }
  };

  const handleCreateConnect = async () => {
    try {
      if (!profile?.id) {
        alert("Perfil não carregado");
        return;
      }

      const response = await fetch("/api/connect/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: profile.id,
        }),
      });

      const data = await response.json();

      console.log("CONNECT RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data.error);
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Erro ao iniciar onboarding");
    }
  };

  const handleManageAccount = async () => {
    const response = await fetch("/api/connect/login-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: profile.id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    window.location.href = data.url;
  };

  return (
    <div className="px-4 sm:px-2">
      <div className="md:m-auto lg:m-2 lg:w-[calc(80dvw-256px)] max-w-[1024px] min-h-[calc(100dvh-110px)] rounded-2xl overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="default-h2 font-semibold">Pagamentos Bite Menu</h2>
        </div>

        <button onClick={handleCreateConnect} className="p-2 m-2 bg-blue-500 text-white rounded">
          Configurar recebimentos
        </button>

        <hr />

        {profile?.stripe_connect_ready ? (
          <div>
            <p>Conta conectada</p>
            <button onClick={handleManageAccount} className="p-2 m-2 bg-blue-500 text-white rounded">
              Gerenciar conta Stripe
            </button>
          </div>
        ) : (
          <p>Conta não conectada</p>
        )}
      </div>
    </div>
  );
};

export default BiteMenuPayments;
