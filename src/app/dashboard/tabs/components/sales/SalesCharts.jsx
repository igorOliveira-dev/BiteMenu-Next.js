"use client";

import { useMemo } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function SalesCharts({ sales = [] }) {
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

  /** -------------------------
   * Donuts (contagem simples)
   * ------------------------ */
  const paymentCounts = useMemo(() => {
    return Object.keys(paymentLabels).reduce((acc, key) => {
      acc[key] = sales.filter((s) => s.payment_method === key).length;
      return acc;
    }, {});
  }, [sales]);

  const serviceCounts = useMemo(() => {
    return Object.keys(serviceLabels).reduce((acc, key) => {
      acc[key] = sales.filter((s) => s.service === key).length;
      return acc;
    }, {});
  }, [sales]);

  const filteredPayments = Object.entries(paymentCounts).filter(([_, count]) => count > 0);
  const filteredServices = Object.entries(serviceCounts).filter(([_, count]) => count > 0);

  const paymentData = {
    labels: filteredPayments.map(([key]) => paymentLabels[key]),
    datasets: [
      {
        data: filteredPayments.map(([_, value]) => value),
        backgroundColor: ["#4CAF50", "#2196F3", "#FFC107", "#9C27B0"].slice(0, filteredPayments.length),
        borderWidth: 0,
      },
    ],
  };

  const serviceData = {
    labels: filteredServices.map(([key]) => serviceLabels[key]),
    datasets: [
      {
        data: filteredServices.map(([_, value]) => value),
        backgroundColor: ["#FF5722", "#03A9F4", "#8BC34A", "#E91E63"].slice(0, filteredServices.length),
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    cutout: "62%",
    maintainAspectRatio: false,
  };

  /** -----------------------------------------
   * Top 5 Produtos — Barras horizontais (qty)
   *  - NÃO separa por delivery/pickup/etc
   *  - cresce na horizontal
   * ---------------------------------------- */
  const topProducts = useMemo(() => {
    const productQty = {}; // product -> total qty

    sales.forEach((sale) => {
      const items = sale?.items_list || [];
      items.forEach((item) => {
        const name = item?.name || item?.title || item?.product_name || "Produto";
        const qty = Number(item?.qty ?? item?.quantity ?? 0) || 0;
        if (!qty) return;

        productQty[name] = (productQty[name] || 0) + qty;
      });
    });

    return Object.entries(productQty)
      .map(([product, qty]) => ({ product, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales]);

  const topProductsBarData = useMemo(() => {
    if (!topProducts.length) return null;

    return {
      labels: topProducts.map((p) => p.product),
      datasets: [
        {
          label: "Quantidade vendida",
          data: topProducts.map((p) => p.qty),
          backgroundColor: "#4f46e5",
          borderColor: "#463ede",
          borderWidth: 1,
          barThickness: 28,
        },
      ],
    };
  }, [topProducts]);

  const topProductsBarOptions = {
    indexAxis: "y", // <- deixa horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Qtd: ${ctx.parsed.x}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y: {
        grid: { display: false },
        ticks: {
          // evita label gigante zoar layout
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return label.length > 22 ? label.slice(0, 22) + "…" : label;
          },
        },
      },
    },
  };

  /** -------------------------
   * Card genérico
   * ------------------------ */
  const ChartCard = ({ title, data, items, labelsMap }) => {
    return (
      <div className="bg-translucid border border-translucid rounded-lg p-4 sm:p-5">
        <h3 className="font-semibold color-gray mb-4">{title}</h3>

        <div className="grid grid-cols-1 xxs:grid-cols-[160px_1fr] gap-4 items-center">
          <div className="h-[160px] w-[160px] mx-auto sm:mx-0">
            <Doughnut data={data} options={doughnutOptions} />
          </div>

          <div className="flex flex-col gap-2">
            {items.map(([key, count], index) => (
              <div key={key} className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: data.datasets[0].backgroundColor[index] }}
                  />
                  <span className="color-gray">{labelsMap[key]}</span>
                </div>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (filteredPayments.length === 0 && filteredServices.length === 0 && !topProductsBarData) {
    return <p className="color-gray text-center">Nenhuma venda no período selecionado.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {filteredPayments.length > 0 && (
        <ChartCard title="Métodos de Pagamento" data={paymentData} items={filteredPayments} labelsMap={paymentLabels} />
      )}

      {filteredServices.length > 0 && (
        <ChartCard title="Tipos de Serviço" data={serviceData} items={filteredServices} labelsMap={serviceLabels} />
      )}

      {topProductsBarData && (
        <div className="bg-translucid border border-translucid rounded-lg p-4 sm:p-5 lg:col-span-2">
          <h3 className="font-semibold color-gray mb-4">Top 5 produtos mais vendidos</h3>

          <div className="h-[320px] sm:h-[380px]">
            <Bar data={topProductsBarData} options={topProductsBarOptions} />
          </div>
        </div>
      )}
    </div>
  );
}
