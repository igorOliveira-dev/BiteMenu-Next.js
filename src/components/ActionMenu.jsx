"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaEllipsisVertical } from "react-icons/fa6";

function findScrollParent(el) {
  let parent = el?.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    const overflowY = style.overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

function ActionsMenuPanel({ anchorRef, onClose, children }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    function updatePosition() {
      if (!anchorRef.current || !menuRef.current) return;

      const margin = 8;
      const gap = 6;

      const anchorRect = anchorRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;

      let top;
      if (spaceBelow >= menuRect.height + gap || spaceBelow >= spaceAbove) {
        top = anchorRect.bottom + gap;
      } else {
        top = anchorRect.top - menuRect.height - gap;
      }
      top = Math.min(Math.max(top, margin), viewportHeight - menuRect.height - margin);

      const spaceRightAligned = anchorRect.right - menuRect.width;
      const spaceLeftAligned = viewportWidth - (anchorRect.left + menuRect.width);

      let left;
      if (spaceRightAligned < margin && spaceLeftAligned >= margin) {
        left = anchorRect.left;
      } else {
        left = anchorRect.right - menuRect.width;
      }
      left = Math.min(Math.max(left, margin), viewportWidth - menuRect.width - margin);

      setPos({ top, left });
      setReady(true);
    }

    updatePosition();
  }, [anchorRef]);

  useEffect(() => {
    if (!anchorRef.current) return;

    const scrollParent = findScrollParent(anchorRef.current);
    const target = scrollParent === window ? window : scrollParent;

    const initialTop = scrollParent === window ? window.scrollY : scrollParent.scrollTop;
    const initialLeft = scrollParent === window ? window.scrollX : scrollParent.scrollLeft;

    function handleScroll() {
      const currentTop = scrollParent === window ? window.scrollY : scrollParent.scrollTop;
      const currentLeft = scrollParent === window ? window.scrollX : scrollParent.scrollLeft;

      const dy = Math.abs(currentTop - initialTop);
      const dx = Math.abs(currentLeft - initialLeft);

      if (dy > 4 || dx > 4) {
        onClose();
      }
    }

    target.addEventListener("scroll", handleScroll);
    return () => target.removeEventListener("scroll", handleScroll);
  }, [anchorRef, onClose]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : -9999,
        visibility: ready ? "visible" : "hidden",
        backgroundColor: "var(--menu-bg, #2b2b2b)",
        border: "1px solid var(--translucid)",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        zIndex: 9999,
        minWidth: 170,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

/**
 * Botão de 3 pontinhos que abre um menu de ações posicionado via portal.
 * options: [{ label, icon?: ReactNode, onClick, danger?: boolean }]
 */
const ActionsMenu = ({ options, buttonClassName = "" }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Abrir opções"
        className={`cursor-pointer p-2 rounded ${buttonClassName}`}
        style={{
          backgroundColor: "var(--translucid)",
        }}
      >
        <FaEllipsisVertical />
      </button>

      {open && (
        <ActionsMenuPanel anchorRef={btnRef} onClose={() => setOpen(false)}>
          {options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                opt.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-3 text-sm text-left cursor-pointer transition hover:bg-[var(--translucid)] ${
                opt.danger ? "text-red-500" : ""
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </ActionsMenuPanel>
      )}
    </>
  );
};

export default ActionsMenu;
