"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

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
    faceToFace: "Presencial",
  };

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

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    cutout: "60%",
    maintainAspectRatio: false,
  };

  return (
    <div className="flex flex-wrap lg:justify-center gap-12 p-6 bg-translucid border border-translucid rounded-lg">
      {filteredPayments.length === 0 && <p className="color-gray text-center">Nenhuma venda no período selecionado.</p>}

      {filteredPayments.length > 0 && (
        <div className="xxs:min-w-[300px] xxs:mx-auto lg:mx-0">
          <h3 className="font-semibold color-gray lg:text-center mb-6">Métodos de Pagamento</h3>
          <div className="flex items-center">
            <div className="w-26 h-26 xs:w-32 xs:h-32 lg:w-42 lg:h-42">
              <Doughnut data={paymentData} options={options} />
            </div>
            <div className="mt-2 ml-4 flex flex-col gap-1">
              {filteredPayments.map(([key, count], index) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: paymentData.datasets[0].backgroundColor[index] }}
                  />
                  <span>
                    {paymentLabels[key]} ({count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {filteredServices.length > 0 && (
        <div className="xxs:min-w-[300px] xxs:mx-auto lg:mx-0">
          <h3 className="font-semibold color-gray lg:text-center mb-6">Tipos de Serviço</h3>
          <div className="flex items-center">
            <div className="w-26 h-26 xs:w-32 xs:h-32 lg:w-42 lg:h-42">
              <Doughnut data={serviceData} options={options} />
            </div>
            <div className="mt-2 ml-4 flex flex-col gap-1">
              {filteredServices.map(([key, count], index) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: serviceData.datasets[0].backgroundColor[index] }}
                  />
                  <span>
                    {serviceLabels[key]} ({count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
