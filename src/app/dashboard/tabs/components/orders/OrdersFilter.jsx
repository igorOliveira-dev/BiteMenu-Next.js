"use client";
import React, { useState, useEffect, useMemo } from "react";
import { FaFilter, FaTimes, FaSearch, FaChair, FaChevronDown } from "react-icons/fa";
import useMenu from "@/hooks/useMenu";
import { supabase } from "@/lib/supabaseClient";

function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs border border-translucid bg-translucid color-gray">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer p-0.5 rounded-full hover:bg-white/10 transition"
        aria-label={`Remover filtro: ${label}`}
      >
        <FaTimes size={9} />
      </button>
    </span>
  );
}

export default function OrdersFilter({ onChange, initial = {} }) {
  const { menu } = useMenu();

  const allowedPayments = useMemo(() => {
    const base = menu?.payments ?? [];
    const hasStripe = menu?.use_stripe_express && (menu?.stripe_payment_methods ?? []).length > 0;
    return hasStripe ? [...base, "stripe"] : base;
  }, [menu]);
  const allowedServices = menu?.services ?? [];

  const [expanded, setExpanded] = useState(false);
  const [hasTableOrders, setHasTableOrders] = useState(false);

  const [isPaid, setIsPaid] = useState(initial.isPaid ?? "all");
  const [deliveryType, setDeliveryType] = useState(initial.deliveryType ?? "all");
  const [payment, setPayment] = useState(initial.payment ?? "all");
  const [tableOnly, setTableOnly] = useState(initial.tableOnly ?? false);

  // só mostra o filtro "somente mesas" se o estabelecimento já tiver algum pedido vindo de mesa
  useEffect(() => {
    if (!menu?.id) return;

    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("menu_id", menu.id)
      .not("table_id", "is", null)
      .then(({ count }) => setHasTableOrders((count ?? 0) > 0));
  }, [menu?.id]);

  // texto do input (imediato)
  const [search, setSearch] = useState(initial.search ?? "");
  // valor "confirmado" (debounced)
  const [debouncedSearch, setDebouncedSearch] = useState((initial.search ?? "").trim());

  const sortDir = "asc";

  // Debounce: só atualiza debouncedSearch 1s após parar de digitar
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
      tableOnly,
      search: debouncedSearch,
      sortDir,
    });
  }, [isPaid, deliveryType, payment, tableOnly, debouncedSearch, sortDir]);

  const clearAll = () => {
    setIsPaid("all");
    setDeliveryType("all");
    setPayment("all");
    setTableOnly(false);
    setSearch("");
    setDebouncedSearch(""); // força limpeza imediata sem esperar o debounce
  };

  const paymentLabels = {
    cash: "Dinheiro",
    debit: "Débito",
    credit: "Crédito",
    pix: "PIX",
    stripe: "Stripe",
  };

  const serviceLabels = {
    delivery: "Entrega",
    pickup: "Retirada",
    dinein: "Comer no local",
    faceToFace: "Atendimento presencial",
  };

  const activeCount = [deliveryType !== "all", payment !== "all", isPaid !== "all", tableOnly, Boolean(search)].filter(
    Boolean,
  ).length;

  const fieldClass =
    "w-full border border-translucid rounded-lg px-3 py-2 text-sm bg-translucid color-gray outline-none focus:ring-2 focus:ring-blue-500/40 transition";

  return (
    <div className="my-4 rounded-2xl border border-translucid bg-[var(--low-translucid)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="cursor-pointer w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center gap-2">
          <FaFilter />
          <strong>Filtros</strong>
          {activeCount > 0 && (
            <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-blue-600/30">{activeCount}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="cursor-pointer text-xs px-2 py-1.5 border border-translucid color-gray rounded-lg flex items-center gap-1 hover:opacity-80 transition"
            >
              <FaTimes /> Limpar tudo
            </span>
          )}
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border border-translucid transition-transform ${
              expanded ? "rotate-180" : "rotate-0"
            }`}
          >
            <FaChevronDown className="text-xs" />
          </span>
        </div>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 border-t border-translucid pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs color-gray mb-1">Buscar</label>
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nome, telefone ou nº do pedido..."
                    className={`${fieldClass} pr-9`}
                  />
                  <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs color-gray mb-1">Serviço</label>
                <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className={fieldClass}>
                  <option className="text-black" value="all">
                    Todos os serviços
                  </option>
                  {allowedServices.map((service) => (
                    <option className="text-black" key={service} value={service}>
                      {serviceLabels[service] ?? service}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs color-gray mb-1">Pagamento</label>
                <select value={payment} onChange={(e) => setPayment(e.target.value)} className={fieldClass}>
                  <option className="text-black" value="all">
                    Todos os pagamentos
                  </option>
                  {allowedPayments.map((method) => (
                    <option className="text-black" key={method} value={method}>
                      {paymentLabels[method] ?? method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs color-gray mb-1">Status</label>
                <select value={isPaid} onChange={(e) => setIsPaid(e.target.value)} className={fieldClass}>
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
              </div>
            </div>

            {hasTableOrders && (
              <div className="mt-3">
                <label className="block text-xs color-gray mb-1">Origem</label>
                <button
                  type="button"
                  onClick={() => setTableOnly((v) => !v)}
                  className={`cursor-pointer flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition ${
                    tableOnly
                      ? "bg-blue-600/80 border-blue-600 text-white"
                      : "border-translucid bg-translucid color-gray hover:opacity-80"
                  }`}
                >
                  <FaChair /> Somente pedidos em mesas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="px-4 pb-4 pt-3 border-t border-translucid flex gap-2 flex-wrap">
          {deliveryType !== "all" && (
            <FilterChip
              label={`Serviço: ${serviceLabels[deliveryType] ?? deliveryType}`}
              onRemove={() => setDeliveryType("all")}
            />
          )}
          {payment !== "all" && (
            <FilterChip
              label={`Pagamento: ${paymentLabels[payment] ?? payment}`}
              onRemove={() => setPayment("all")}
            />
          )}
          {isPaid !== "all" && (
            <FilterChip
              label={isPaid === "true" ? "Somente pagos" : "Somente não pagos"}
              onRemove={() => setIsPaid("all")}
            />
          )}
          {tableOnly && hasTableOrders && (
            <FilterChip label="Somente mesas" onRemove={() => setTableOnly(false)} />
          )}
          {search && <FilterChip label={`Busca: "${search}"`} onRemove={() => setSearch("")} />}
        </div>
      )}
    </div>
  );
}
