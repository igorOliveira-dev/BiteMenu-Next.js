"use client";

import useUser from "@/hooks/useUser";

const BiteMenuPayments = () => {
  const { profile } = useUser();

  const handleCreateConnect = async () => {
    try {
      const response = await fetch("/api/connect/onboarding", {
        method: "POST",
      });

      const data = await response.json();

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
