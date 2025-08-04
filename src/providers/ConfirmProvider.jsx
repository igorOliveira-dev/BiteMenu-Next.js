"use client";

import { createContext, useContext, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null);

  // Função global que será usada para abrir o modal
  const confirm = (message) => {
    return new Promise((resolve) => {
      setOptions({ message, resolve });
    });
  };

  const handleConfirm = () => {
    options?.resolve(true);
    setOptions(null);
  };

  const handleCancel = () => {
    options?.resolve(false);
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && <ConfirmModal message={options.message} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </ConfirmContext.Provider>
  );
}

// Hook para acessar facilmente
export function useConfirm() {
  return useContext(ConfirmContext);
}
