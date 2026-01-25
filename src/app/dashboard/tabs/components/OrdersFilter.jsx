"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { FaFilter, FaTimes, FaSearch } from "react-icons/fa";
import useMenu from "@/hooks/useMenu";

export default function OrdersFilter({ onChange, initial = {} }) {
  const { menu } = useMenu();

  const allowedPayments = menu?.payments ?? [];
  const allowedServices = menu?.services ?? [];

  const [isPaid, setIsPaid] = useState(initial.isPaid ?? "all");
  const [deliveryType, setDeliveryType] = useState(initial.deliveryType ?? "all");
  const [payment, setPayment] = useState(initial.payment ?? "all");

  // texto do input (imediato)
  const [search, setSearch] = useState(initial.search ?? "");
  // valor “confirmado” (debounced)
  const [debouncedSearch, setDebouncedSearch] = useState((initial.search ?? "").trim());

  const sortDir = "asc";

  // Debounce: só atualiza debouncedSearch 2s após parar de digitar
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 1000);

    return () => clearTimeout(t);
  }, [search]);

  // Emite filtros pro pai (mudanças de selects são imediatas; search é debounced)
  useEffect(() => {
    onChange?.({
      isPaid: isPaid === "all" ? "all" : isPaid === "true",
      deliveryType,
      payment,
      search: debouncedSearch,
      sortDir,
    });
  }, [isPaid, deliveryType, payment, debouncedSearch, sortDir, onChange]);

  const clearAll = () => {
    setIsPaid("all");
    setDeliveryType("all");
    setPayment("all");
    setSearch("");
    // debouncedSearch vai virar "" em até 2s (ou você pode forçar já, se quiser)
  };

  const paymentLabels = {
    cash: "Dinheiro",
    debit: "Débito",
    credit: "Crédito",
    pix: "PIX",
  };

  const serviceLabels = {
    delivery: "Entrega",
    pickup: "Retirada",
    dinein: "Comer no local",
    faceToFace: "Atendimento presencial",
  };

  return (
    <div className="my-4 rounded-md shadow-sm">
      <div className="flex flex-col justify-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FaFilter />
          <strong>Filtros</strong>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <div className="relative w-70">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou telefone"
              className="border border-2 border-translucid rounded px-3 py-1 text-sm pr-9 w-70 outline-none"
            />
            <FaSearch className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <select
            value={deliveryType}
            onChange={(e) => setDeliveryType(e.target.value)}
            className="border border-2 border-translucid rounded px-2 py-1 text-sm color-gray"
          >
            <option className="text-black" value="all">
              Todos os serviços
            </option>
            {allowedServices.map((service) => (
              <option className="text-black" key={service} value={service}>
                {serviceLabels[service] ?? service}
              </option>
            ))}
          </select>

          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            className="border border-2 border-translucid rounded px-2 py-1 text-sm color-gray"
          >
            <option className="text-black" value="all">
              Todos os pagamentos
            </option>
            {allowedPayments.map((method) => (
              <option className="text-black" key={method} value={method}>
                {paymentLabels[method] ?? method}
              </option>
            ))}
          </select>

          <select
            value={isPaid}
            onChange={(e) => setIsPaid(e.target.value)}
            className="border border-2 border-translucid rounded px-2 py-1 text-sm color-gray"
          >
            <option className="text-black" value="all">
              Pagos e não pagos
            </option>
            <option className="text-black" value="true">
              Somente pagos
            </option>
            <option className="text-black" value="false">
              Somente não pagos
            </option>
          </select>

          <button
            onClick={clearAll}
            className="text-sm px-2 py-1 border border-2 border-translucid color-gray rounded flex items-center gap-1"
          >
            <FaTimes /> Limpar
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 flex-wrap">
        {deliveryType !== "all" && (
          <span className="px-2 py-1 rounded text-sm color-gray">
            Serviço: {serviceLabels[deliveryType] ?? deliveryType}
          </span>
        )}
        {payment !== "all" && (
          <span className="px-2 py-1 rounded text-sm color-gray">Pagamento: {paymentLabels[payment] ?? payment}</span>
        )}
        {isPaid !== "all" && (
          <span className="px-2 py-1 rounded text-sm color-gray">
            {isPaid === "true" ? "Somente pagos" : "Somente não pagos"}
          </span>
        )}
        {search && <span className="px-2 py-1 rounded text-sm color-gray">Busca: {search}</span>}
      </div>
    </div>
  );
}
