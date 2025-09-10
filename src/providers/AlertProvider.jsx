"use client";

import { createContext, useContext, useState, useCallback } from "react";

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    const newAlert = { id, message, type, duration, visible: true };
    setAlerts((prev) => [...prev, newAlert]);

    // Inicia a contagem para sumir
    setTimeout(() => closeAlert(id), duration);
  }, []);

  const closeAlert = (id) => {
    // marca como invisível para animar saída
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, visible: false } : a)));

    // remove de vez depois da animação
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 300); // tempo igual ao do fade-out
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}

      <div className="fixed top-4 right-4 space-y-3 z-50">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`border border-[var(--background)] m-1 relative w-60 sm:w-80 px-4 py-3 rounded shadow transform transition-all duration-300 ease-in-out backdrop-blur-md
              ${a.type === "error" ? "bg-[#ff000050]" : a.type === "success" ? "bg-[#00ff0050]" : "var(--translucid)"}
              ${a.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5"}
            `}
          >
            {/* mensagem */}
            <span>{a.message}</span>

            {/* botão X */}
            <button onClick={() => closeAlert(a.id)} className="absolute top-2 right-2 text-3xl hover:text-gray-200">
              ×
            </button>

            {/* barra de progresso */}
            <div
              className="absolute bottom-0 left-0 h-1 bg-white/70"
              style={{
                animation: `progress ${a.duration}ms linear forwards`,
              }}
            />
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  return useContext(AlertContext);
}
