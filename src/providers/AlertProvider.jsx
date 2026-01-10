"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { FaTimes } from "react-icons/fa";

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback(
    (
      message,
      type = "info",
      options = {} // aqui vem duração, cores, etc
    ) => {
      const { duration = 4000, backgroundColor = null, textColor = null } = options;

      const id = Date.now();
      const newAlert = {
        id,
        message,
        type,
        duration,
        visible: true,
        backgroundColor,
        textColor,
      };
      setAlerts((prev) => [...prev, newAlert]);

      setTimeout(() => closeAlert(id), duration);
    },
    []
  );

  const closeAlert = (id) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, visible: false } : a)));

    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 300); // fade-out duration
  };

  const getBackgroundColor = (a) => {
    if (a.backgroundColor) return a.backgroundColor;
    if (a.type === "error") return "#ff000010";
    if (a.type === "success") return "#00ff0020";
    return "var(--translucid)";
  };

  const getTextColor = (a) => {
    if (a.textColor) return a.textColor;
    return "inherit";
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}

      <div className="fixed top-4 right-0 xs:right-4 space-y-3 z-150">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`border border-[var(--background)] m-1 relative max-w-120 px-2 py-3 rounded transform transition-all duration-300 ease-in-out backdrop-blur-md flex items-center justify-between
              ${a.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5"}
            `}
            style={{
              backgroundColor: getBackgroundColor(a),
              color: getTextColor(a),
            }}
          >
            <span>{a.message}</span>

            <button onClick={() => closeAlert(a.id)} className="cursor-pointer text-xl ml-2">
              <FaTimes />
            </button>

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
