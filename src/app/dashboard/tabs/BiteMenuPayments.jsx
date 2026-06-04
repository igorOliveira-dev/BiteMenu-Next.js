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

  return (
    <div>
      <h1>Pagamentos Bite Menu</h1>

      <button onClick={handleCreateConnect}>Configurar recebimentos</button>

      <hr />

      {profile?.stripe_connect_ready ? <p>Conta conectada</p> : <p>Conta não conectada</p>}
    </div>
  );
};

export default BiteMenuPayments;
