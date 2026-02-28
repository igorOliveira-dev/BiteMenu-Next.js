"use client";

import { useEffect, useRef } from "react";

export default function useModalBackHandler(isOpen, onClose) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      onCloseRef.current?.();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
      }
    };

    // empurra estado para permitir voltar
    try {
      const currentState = window.history.state || {};
      window.history.pushState({ ...currentState, __modal: true }, "");
    } catch {}

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);
}
