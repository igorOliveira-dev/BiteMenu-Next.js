"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import useChartColors from "@/hooks/useChartColors";
import { formatCurrency } from "@/lib/formatCurrency";
import { lineValue } from "@/lib/salesInsights";

ChartJS.register(ArcElement, Tooltip, Legend);

// A ordem das chaves é a ordem fixa das cores (--chart-1..5): cada método mantém a cor mesmo se outro sumir do período
const paymentLabels = {
  pix: "Pix",
  pix_online: "Pix online (pago)",
  credit: "Crédito",
  cash: "Dinheiro",
  debit: "Débito",
  stripe: "Stripe",
};

const serviceLabels = {
  delivery: "Entrega",
  pickup: "Retirada",
  dinein: "Comer no local",
  faceToFace: "Atendimento presencial",
};

// Segunda primeiro (mesma convenção de semana do dashboard); o número é o getDay()
const WEEKDAYS = [
  [1, "Segunda"],
  [2, "Terça"],
  [3, "Quarta"],
  [4, "Quinta"],
  [5, "Sexta"],
  [6, "Sábado"],
  [0, "Domingo"],
];

// Lista com barras em CSS: rows = [{ label, value (tamanho da barra), main, sub }]
function BarList({ rows, color }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0">
              <span className="font-semibold">{r.main}</span> <span className="color-gray">· {r.sub}</span>
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-[var(--translucid)]">
            <div className="h-2 rounded-full" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const defaultSaleValue = (s) => Number(s.total) || 0;

export default function SalesCharts({ sales = [], getSaleValue = defaultSaleValue, currency }) {
  const colors = useChartColors();

  // Faturamento e quantidade por chave (método de pagamento / tipo de serviço), só as que tiveram venda
  const [payments, services] = useMemo(() => {
    const sumBy = (labelsMap, field) =>
      Object.keys(labelsMap)
        .map((key) => {
          const rows = sales.filter((s) => s[field] === key);
          return { key, count: rows.length, total: rows.reduce((acc, s) => acc + getSaleValue(s), 0) };
        })
        .filter((r) => r.count > 0);
    return [sumBy(paymentLabels, "payment_method"), sumBy(serviceLabels, "service")];
  }, [sales, getSaleValue]);

  // Top 5 produtos por quantidade, com o faturamento de cada um (preço + adicionais)
  const topProducts = useMemo(() => {
    const byName = {};
    sales.forEach((sale) => {
      (sale?.items_list || []).forEach((item) => {
        const name = item?.name || item?.title || item?.product_name || "Produto";
        const qty = Number(item?.qty ?? item?.quantity ?? 0) || 0;
        if (!qty) return;
        byName[name] ??= { qty: 0, revenue: 0 };
        byName[name].qty += qty;
        byName[name].revenue += lineValue(item);
      });
    });
    return Object.entries(byName)
      .map(([product, v]) => ({ product, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales]);

  const weekdays = useMemo(() => {
    const byDay = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));
    sales.forEach((s) => {
      const day = byDay[new Date(s.created_at).getDay()];
      day.total += getSaleValue(s);
      day.count += 1;
    });
    return WEEKDAYS.map(([i, label]) => ({ label, ...byDay[i] }));
  }, [sales, getSaleValue]);

  if (!colors) return null;

  const colorOf = (labelsMap, key) => colors.series[Object.keys(labelsMap).indexOf(key)];

  const doughnutData = (items, labelsMap) => ({
    labels: items.map((r) => labelsMap[r.key]),
    datasets: [
      {
        data: items.map((r) => r.total),
        backgroundColor: items.map((r) => colorOf(labelsMap, r.key)),
        borderColor: colors.surface,
        borderWidth: 2,
      },
    ],
  });

  const doughnutOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.parsed, currency) } },
    },
    cutout: "62%",
    maintainAspectRatio: false,
  };

  /** -------------------------
   * Card genérico
   * ------------------------ */
  const ChartCard = ({ title, items, labelsMap }) => {
    return (
      <div className="bg-translucid border border-translucid rounded-xl p-4 sm:p-5">
        <h3 className="text-base font-semibold mb-4">{title}</h3>

        <div className="grid grid-cols-1 xxs:grid-cols-[160px_1fr] gap-4 items-center">
          <div className="h-[160px] w-[160px] mx-auto sm:mx-0">
            <Doughnut data={doughnutData(items, labelsMap)} options={doughnutOptions} />
          </div>

          <div className="flex flex-col gap-2">
            {items.map((r) => (
              <div key={r.key} className="flex flex-wrap items-center gap-x-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorOf(labelsMap, r.key) }} />
                  <span className="color-gray">{labelsMap[r.key]}</span>
                </div>
                <span className="font-semibold">{formatCurrency(r.total, currency)}</span>
                <span className="color-gray">
                  · {r.count} {r.count === 1 ? "venda" : "vendas"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (sales.length === 0) {
    return <p className="color-gray text-center">Nenhuma venda no período selecionado.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {payments.length > 0 && <ChartCard title="Faturamento por pagamento" items={payments} labelsMap={paymentLabels} />}

      {services.length > 0 && <ChartCard title="Faturamento por tipo de serviço" items={services} labelsMap={serviceLabels} />}

      {topProducts.length > 0 && (
        <div className="bg-translucid border border-translucid rounded-xl p-4 sm:p-5">
          <h3 className="text-base font-semibold mb-4">Produtos mais vendidos</h3>
          <BarList
            color={colors.series[3]} // azul: volume, sem conotação de dinheiro ou alerta
            rows={topProducts.map((p) => ({
              label: p.product,
              value: p.qty,
              main: `${p.qty} un.`,
              sub: formatCurrency(p.revenue, currency),
            }))}
          />
        </div>
      )}

      <div className="bg-translucid border border-translucid rounded-xl p-4 sm:p-5">
        <h3 className="text-base font-semibold mb-4">Faturamento por dia da semana</h3>
        <BarList
          color={colors.series[3]}
          rows={weekdays.map((d) => ({
            label: d.label,
            value: d.total,
            main: formatCurrency(d.total, currency),
            sub: `${d.count} ${d.count === 1 ? "venda" : "vendas"}`,
          }))}
        />
      </div>
    </div>
  );
}
