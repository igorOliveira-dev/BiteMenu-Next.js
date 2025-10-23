"use client";

import { useEffect, useState, useMemo } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import { FaTrash, FaChevronLeft, FaChevronDown, FaChevronRight } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { useConfirm } from "@/providers/ConfirmProvider";
import OrdersFilter from "./components/OrdersFilter";

const Sales = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();

  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [filters, setFilters] = useState({});
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({}); // chave: "MMMM YYYY" => boolean

  useEffect(() => {
    if (!menu?.id) return;
    fetchSales();

    const channel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, (payload) => {
        if (payload.new?.menu_id === menu.id) fetchSales();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [menu?.id]);

  const fetchSales = async () => {
    setLoadingSales(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("menu_id", menu.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      customAlert("Erro ao carregar vendas", "error");
    } else {
      setSales(data || []);
    }
    setLoadingSales(false);
  };

  const deleteSale = async (id) => {
    const ok = await confirm("Quer mesmo excluir essa venda?");
    if (!ok) return;
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) return customAlert("Erro ao excluir venda", "error");
    customAlert("Venda excluída.", "success");
    fetchSales();
  };

  const openSaleModal = (sale) => {
    setSelectedSale(sale);
    setSaleModalOpen(true);
  };

  const computeTotal = (order) => {
    if (!order) return 0;
    const items = order.items_list || [];
    return items.reduce((acc, it) => {
      const itemBase = (Number(it.price) || 0) * (Number(it.qty) || 0);
      const adds = (it.additionals || []).reduce((sa, a) => sa + (Number(a.price) || 0), 0);
      return acc + itemBase + adds;
    }, 0);
  };

  // --- AGRUPAMENTO POR MÊS ---
  const salesGroupedByMonth = useMemo(() => {
    // mapa: key -> { key, monthStart, items: [] }
    const map = {};

    sales.forEach((s) => {
      const d = new Date(s.created_at || s.updated_at || Date.now());
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const key = d.toLocaleString("pt-BR", { month: "long", year: "numeric" }); // "outubro de 2025" or "outubro 2025" depending env
      if (!map[key]) {
        map[key] = { key, monthStart, items: [] };
      }
      map[key].items.push(s);
    });

    // transformar em array e ordenar por monthStart descendente (mais recente primeiro)
    const arr = Object.values(map).sort((a, b) => b.monthStart - a.monthStart);
    return arr;
  }, [sales]);
  // --- FIM AGRUPAMENTO ---

  const toggleMonth = (key) => {
    setExpandedMonths((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading || loadingSales) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu cardápio.</p>;

  return (
    <div className="px-2 lg:grid">
      <div className="md:m-auto lg:m-2 lg:w-[calc(70dvw-256px)] max-w-[768px] min-h-[calc(100dvh-110px)] rounded-lg overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2 ml-2">Histórico de Vendas</h2>

        <div>
          {salesGroupedByMonth.length === 0 ? (
            <p className="text-center color-gray p-6">Nenhuma venda encontrada com esses filtros.</p>
          ) : (
            <div className="space-y-6">
              {salesGroupedByMonth.map((group) => {
                const monthTotal = group.items.reduce((sum, s) => sum + (Number(s.total) || computeTotal(s)), 0);
                const monthCount = group.items.length;
                const isOpen = expandedMonths[group.key] ?? true;
                return (
                  <section key={group.key} className="border border-translucid rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleMonth(group.key)}
                      className="w-full flex justify-between items-center p-3 bg-low-gray hover:opacity-95"
                    >
                      <div>
                        <h3 className="font-semibold text-lg capitalize">{group.key}</h3>
                        <p className="text-sm color-gray text-start flex gap-2 items-center">{monthCount} venda(s)</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="font-semibold">R$ {monthTotal.toFixed(2)}</p>
                        {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-4 space-y-4">
                        {group.items.map((sale) => (
                          <div
                            key={sale.id}
                            className="p-4 rounded-lg shadow-sm bg-low-gray flex flex-col xs:flex-row justify-between"
                          >
                            <div>
                              <h3 className="font-bold text-lg line-clamp-1">{sale.costumer_name || "Cliente"}</h3>
                              <span className="text-sm color-gray xs:hidden">
                                {new Date(sale.created_at).toLocaleString("pt-BR")}
                              </span>
                              <p className="text-sm color-gray">
                                <span className="line-clamp-1">
                                  <strong>Método:</strong>{" "}
                                  {sale.payment_method === "pix"
                                    ? "Pix"
                                    : sale.payment_method === "debit"
                                    ? "Débito"
                                    : sale.payment_method === "credit"
                                    ? "Crédito"
                                    : sale.payment_method === "cash"
                                    ? "Dinheiro"
                                    : "Não informado"}
                                </span>
                                <span className="line-clamp-1">
                                  <strong>Serviço:</strong>{" "}
                                  {sale.service === "delivery"
                                    ? "Entrega"
                                    : sale.service === "pickup"
                                    ? "Retirada"
                                    : sale.service === "dinein"
                                    ? "No local"
                                    : sale.service === "faceToFace"
                                    ? "Atendimento presencial"
                                    : "Não informado"}
                                </span>
                                <span className="text-sm color-gray">
                                  <strong>Telefone:</strong> {sale.costumer_phone}
                                </span>
                              </p>

                              {sale.items_list && (
                                <ul className="mt-2 text-sm">
                                  {sale.items_list?.slice(0, 4).map((item, i) => (
                                    <li key={i} className="line-clamp-1">
                                      • {item.qty}x {item.name} — R$ {(item.price * item.qty).toFixed(2)}
                                    </li>
                                  ))}
                                  {sale.items_list?.length > 4 && <li className="text-gray-400">...</li>}
                                </ul>
                              )}

                              <p className="mt-2 font-semibold text-lg">
                                Total: R$ {Number(sale.total || computeTotal(sale)).toFixed(2)}
                              </p>
                            </div>

                            <div className="mt-2 flex flex-col justify-between items-start xs:items-end">
                              <span className="text-sm color-gray hidden xs:block">
                                {new Date(sale.updated_at).toLocaleString("pt-BR")}
                              </span>
                              <div className="grid grid-rows-2 w-full xs:flex xs:flex-col gap-2">
                                <div className="grid grid-cols-2 xs:flex xs:flex-col gap-2">
                                  <button
                                    onClick={() => openSaleModal(sale)}
                                    className="w-full cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium bg-translucid border hover:opacity-100 opacity-75 transition"
                                  >
                                    Detalhes
                                  </button>
                                  <button
                                    onClick={() => deleteSale(sale.id)}
                                    className="w-full cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs xxs:text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                                  >
                                    <FaTrash /> Excluir
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {saleModalOpen && selectedSale && (
        <GenericModal onClose={() => setSaleModalOpen(false)}>
          <div className="max-h-[90vh] sm:max-h-[80vh] w-[min(900px,90vw)] overflow-y-auto scrollbar-none space-y-4">
            <div className="flex items-center gap-4 mb-2 sticky top-0 bg-low-gray pb-2">
              <div onClick={() => setSaleModalOpen(false)}>
                <FaChevronLeft />
              </div>
              <h2 className="text-xl font-bold">Detalhes da venda</h2>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const total = computeTotal(selectedSale);
                const payload = { ...selectedSale, total, updated_at: new Date().toISOString() };
                const { error } = await supabase.from("sales").update(payload).eq("id", selectedSale.id);
                if (error) return customAlert("Erro ao atualizar venda", "error");
                customAlert("Venda atualizada com sucesso!", "success");
                setSaleModalOpen(false);
                fetchSales();
              }}
            >
              {/* ... o resto do formulário permanece exatamente como antes ... */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedSale.costumer_name || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, costumer_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Telefone</label>
                    <input
                      type="text"
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedSale.costumer_phone || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, costumer_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 xs:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Serviço</label>
                    <select
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedSale.service || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, service: e.target.value })}
                    >
                      <option className="text-black" value="delivery">
                        Entrega
                      </option>
                      <option className="text-black" value="pickup">
                        Retirada
                      </option>
                      <option className="text-black" value="dinein">
                        No local
                      </option>
                      <option className="text-black" value="faceToFace">
                        Atendimento presencial
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Método de Pagamento</label>
                    <select
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedSale.payment_method || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, payment_method: e.target.value })}
                    >
                      <option className="text-black" value="pix">
                        Pix
                      </option>
                      <option className="text-black" value="debit">
                        Débito
                      </option>
                      <option className="text-black" value="credit">
                        Crédito
                      </option>
                      <option className="text-black" value="cash">
                        Dinheiro
                      </option>
                    </select>
                  </div>
                </div>
                <hr className="border-translucid" />
              </div>

              {/* Itens (mantidos) */}
              <div className="mt-8">
                <label className="block text-lg font-semibold mb-2">Itens</label>

                {(selectedSale.items_list || []).map((item, i) => (
                  <div key={i} className="p-3 border border-2 border-translucid rounded-lg space-y-2">
                    <div className="flex gap-2">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-[50px] h-[50px] xs:w-[130px] xs:h-[130px] mt-3 xs:m-0 object-cover rounded-lg"
                          style={{ flexShrink: 0 }}
                        />
                      ) : null}
                      <div className="w-full">
                        <label className="text-sm color-gray">Nome:</label>
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="text"
                            className="input w-full text-sm bg-translucid p-2 rounded"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...selectedSale.items_list];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                            placeholder="Nome do item"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(selectedSale.items_list || [])];
                              updated.splice(i, 1);
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                            className="p-2 text-sm bg-red-600 text-white rounded hover:opacity-90"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="flex gap-6">
                          <div className="flex flex-col">
                            <label className="text-sm color-gray">Quantidade:</label>
                            <input
                              type="number"
                              min="1"
                              className="input w-21 text-sm bg-translucid p-2 rounded"
                              value={item.qty}
                              onChange={(e) => {
                                const updated = [...selectedSale.items_list];
                                updated[i] = { ...updated[i], qty: Number(e.target.value) || 0 };
                                setSelectedSale({ ...selectedSale, items_list: updated });
                              }}
                              placeholder="Qtd"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-sm color-gray">Preço unidade:</label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              className="input max-w-21 flex-1 text-sm bg-translucid p-2 rounded"
                              value={item.price}
                              onChange={(e) => {
                                const value = e.target.value;
                                const updated = [...selectedSale.items_list];
                                updated[i] = { ...updated[i], price: value === "" ? null : Number(value) };
                                setSelectedSale({ ...selectedSale, items_list: updated });
                              }}
                              placeholder="Preço unitário"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm color-gray">Observações:</label>
                      <textarea
                        className="input w-full text-sm p-2 bg-translucid rounded"
                        value={item.note || ""}
                        onChange={(e) => {
                          const updated = [...selectedSale.items_list];
                          updated[i] = { ...updated[i], note: e.target.value };
                          setSelectedSale({ ...selectedSale, items_list: updated });
                        }}
                        placeholder="Observações do item"
                      />
                    </div>

                    {/* Adicionais */}
                    <div className="mt-2 pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold color-gray">Adicionais:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(selectedSale.items_list || [])];
                            const additionals = updated[i].additionals ? [...updated[i].additionals] : [];
                            additionals.push({ name: "", price: 0 });
                            updated[i] = { ...updated[i], additionals };
                            setSelectedSale({ ...selectedSale, items_list: updated });
                          }}
                          className="cursor-pointer px-2 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded"
                        >
                          + Adicional
                        </button>
                      </div>
                      {(item.additionals || []).map((add, ai) => (
                        <div key={ai} className="flex gap-2 items-center mb-2">
                          <input
                            type="text"
                            className="input w-40 xs:w-60 text-sm bg-translucid p-2 rounded"
                            value={add.name}
                            onChange={(e) => {
                              const updated = [...selectedSale.items_list];
                              const ad = updated[i].additionals ? [...updated[i].additionals] : [];
                              ad[ai] = { ...ad[ai], name: e.target.value };
                              updated[i] = { ...updated[i], additionals: ad };
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                            placeholder="Nome do adicional"
                          />
                          <input
                            type="number"
                            step="1"
                            min="0"
                            className="input w-12 xs:w-28 text-sm bg-translucid p-2 rounded"
                            value={add.price ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const updated = [...selectedSale.items_list];
                              const ad = updated[i].additionals ? [...updated[i].additionals] : [];
                              ad[ai] = { ...ad[ai], price: value === "" ? null : Number(value) };
                              updated[i] = { ...updated[i], additionals: ad };
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                            placeholder="Preço"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...selectedSale.items_list];
                              const ad = updated[i].additionals ? [...updated[i].additionals] : [];
                              ad.splice(ai, 1);
                              updated[i] = { ...updated[i], additionals: ad };
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                            className="cursor-pointer p-2 bg-red-600 text-white rounded text-sm"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                    <hr className="border-translucid" />
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSale({
                        ...selectedSale,
                        items_list: [
                          ...(selectedSale.items_list || []),
                          { name: "", qty: 1, price: 0, note: "", additionals: [] },
                        ],
                      })
                    }
                    className="cursor-pointer px-2 py-1 mt-4 bg-blue-600 hover:bg-blue-700 transition text-white rounded"
                  >
                    + Adicionar item
                  </button>
                </div>
              </div>

              {/* total */}
              <div className="sticky bottom-0 bg-low-gray">
                <div className="flex justify-between items-center pt-4">
                  <p className="font-semibold">Total: R$ {computeTotal(selectedSale).toFixed(2)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="cursor-pointer flex-1 w-full bg-blue-600 text-white py-2 rounded-lg mt-3 hover:bg-blue-700 transition"
                  >
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetchSales();
                      setSaleModalOpen(false);
                    }}
                    className="w-32 py-2 rounded-lg mt-3 border"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </GenericModal>
      )}
    </div>
  );
};

export default Sales;
