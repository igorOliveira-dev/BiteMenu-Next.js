"use client";

import { useEffect, useRef } from "react";

/**
 * Hook para fechar modais com o botão "Voltar" do navegador / sistema.
 *
 * - Quando o modal abre (isOpen === true), empurra um novo estado no history.
 * - Quando o usuário aperta "Voltar" e esse estado é removido, disparamos onClose().
 * - Ao fechar o modal por outros meios (X, botão, etc.), o history extra permanece,
 *   mas continua apontando para a mesma URL, o que é aceitável do ponto de vista de UX.
 */
export default function useModalBackHandler(isOpen, onClose) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      if (typeof onCloseRef.current === "function") {
        onCloseRef.current();
      }
    };

    try {
      const currentState = window.history.state || {};
      window.history.pushState({ ...currentState, __modal: true }, "");
    } catch {
      // se history não estiver disponível por algum motivo, apenas ignora
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);
}
