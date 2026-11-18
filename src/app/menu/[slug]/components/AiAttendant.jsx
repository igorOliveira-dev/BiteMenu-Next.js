"use client";
// Atendente IA no cardápio (pedido por conversa, plano Enterprise). Monta o carrinho de sempre (CartContext);
// o pedido sai pelo CartDrawer (endereço, pagamento, cupom), aberto pelo onCheckout.
// Economia: só texto digitado chama a IA. Cartões, chips de categoria, "Adicionar" de item sem escolhas e
// "Finalizar" rodam aqui, sem custo.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FaMagic, FaPaperPlane, FaShoppingCart } from "react-icons/fa";
import { useCartContext } from "@/contexts/CartContext";
import { stockError, addonName } from "@/lib/stock";
import { formatCurrency } from "@/lib/formatCurrency";
import { supabaseImg } from "@/lib/imageUtils";
import { getContrastTextColor } from "@/utils/color";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import { buildCartLine, findMenuItem, itemPrice, needsChoice, visibleItems } from "@/lib/attendant";

const MAX_CARDS = 6;
const isUrl = (u) => typeof u === "string" && /^https?:\/\//.test(u);
const lineTotal = (it) => it.qty * (Number(it.price || 0) + (it.additionals || []).reduce((a, b) => a + Number(b.price || 0), 0));

// Texto que a IA recebe de cada mensagem: cartões e avisos viram uma linha curta (ela não vê a tela)
function toApi(m, menu) {
  const parts = [m.content];
  if (m.cards?.length) parts.push(`[Cartões mostrados: ${m.cards.map((r) => findMenuItem(menu, r)?.name).filter(Boolean).join(", ")}]`);
  if (m.notes?.length) parts.push(`[${m.notes.map((n) => n.text).join("; ")}]`);
  if (m.checkout) parts.push("[Resumo do pedido mostrado]");
  return { role: m.role, content: parts.filter(Boolean).join("\n") };
}

// onOpenCart: só abre o carrinho. onCheckout: o mesmo que "Continuar compra" (confere loja/mínimo e abre a finalização).
export default function AiAttendant({ menu, ownerRole, canShowPromoPrice, storeOpen, onOpenCart, onCheckout, bgColor, foreground, gray, translucid }) {
  const cart = useCartContext();
  const accent = menu.details_color;
  const onAccent = getContrastTextColor(accent);
  const greeting = `Oi! 👋 Sou o atendente virtual do ${menu.title}. Me conta o que você está com vontade que eu monto seu pedido.`;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);
  useModalBackHandler(open, () => setOpen(false));

  const items = useMemo(() => visibleItems(menu), [menu]);
  const categories = useMemo(() => [...new Set(items.map((it) => it.category))], [items]);
  const starred = useMemo(() => items.filter((it) => it.starred), [items]);

  const cartItems = cart.getItems(menu.id);
  const cartCount = cart.totalItems(menu.id);
  const cartTotal = cart.totalPrice(menu.id);

  const push = (m) => setMessages((prev) => [...prev, m]);

  // Valida e põe no carrinho. pending: linhas já adicionadas nesta leva (o estado do carrinho só atualiza depois)
  // base: carrinho a considerar no estoque (padrão: o atual; nas ações da IA, já sem as linhas removidas)
  function addLine(item, choice, pending = [], base = cart.getItems(menu.id)) {
    const { line, error } = buildCartLine(item, choice, canShowPromoPrice);
    if (error) return { error };
    const stock = stockError(ownerRole, [...base, ...pending], item, line.qty, line.additionals.map((a) => a.id));
    if (stock) return { error: stock };
    cart.addItem(menu.id, line);
    pending.push(line);
    return { line };
  }

  function applyActions(actions = []) {
    const out = { cards: [], notes: [], checkout: false };
    const snapshot = cart.getItems(menu.id); // o mesmo carrinho que foi para a IA
    const updates = actions.filter((a) => a.tool === "update_cart").flatMap((a) => a.input?.lines || []);
    const after = snapshot.map((it) => ({ ...it }));
    // da última linha para a primeira: remover uma linha não muda o número das anteriores
    [...updates]
      .sort((a, b) => b.line - a.line)
      .forEach(({ line, qty }) => {
        const it = snapshot[Number(line) - 1];
        if (!it) return;
        const q = Math.max(0, Math.min(99, Math.round(Number(qty) || 0)));
        cart.updateQty(menu.id, Number(line) - 1, q);
        after[Number(line) - 1].qty = q;
        out.notes.push({ text: q ? `Agora ${q}x ${it.name}` : `${it.name} removido` });
      });

    const pending = [];
    for (const a of actions.filter((a) => a.tool === "add_to_cart")) {
      for (const req of a.input?.items || []) {
        const item = findMenuItem(menu, req?.ref);
        const r = item ? addLine(item, req, pending, after.filter((it) => it.qty > 0)) : { error: "Não encontrei um dos itens no cardápio." };
        out.notes.push(r.error ? { error: true, text: r.error } : { text: `${r.line.qty}x ${r.line.name} no carrinho` });
      }
    }

    const refs = actions.filter((a) => a.tool === "show_items").flatMap((a) => a.input?.refs || []);
    out.cards = [...new Set(refs)].filter((r) => findMenuItem(menu, r)).slice(0, MAX_CARDS);
    out.checkout = actions.some((a) => a.tool === "show_checkout");
    return out;
  }

  async function send(text) {
    const content = text.trim().slice(0, 500);
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      // mensagens seguidas do mesmo lado viram uma (ex.: avisos de "Adicionar" entre uma pergunta e outra)
      const history = next
        .filter((m) => !m.error)
        .map((m) => toApi(m, menu))
        .reduce((acc, m) => {
          const last = acc.at(-1);
          if (last?.role === m.role) last.content += `\n${m.content}`;
          else acc.push({ ...m });
          return acc;
        }, []);
      const res = await fetch("/api/attendant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: menu.slug,
          storeOpen,
          messages: history,
          cart: cart.getItems(menu.id).map(({ name, qty, additionals, note }) => ({ name, qty, additionals, note })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || (res.status === 429 ? "Muitas mensagens seguidas. Espere um minutinho." : ""));
      }
      push({ role: "assistant", content: data.reply || "", ...applyActions(data.actions) });
    } catch (err) {
      push({ role: "assistant", error: true, content: err.message || "Não consegui responder agora. Tente de novo." });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // Botões locais (sem IA)
  function showLocal(list, content) {
    push({ role: "user", content: content.user });
    push({ role: "assistant", content: content.reply, cards: list.slice(0, MAX_CARDS).map((it) => String(it.id)) });
  }

  function quickAdd(item) {
    if (needsChoice(item)) return send(`Quero ${item.name}`);
    const r = addLine(item, { qty: 1 });
    push({ role: "assistant", content: "", notes: [r.error ? { error: true, text: r.error } : { text: `1x ${item.name} no carrinho` }] });
  }

  function checkout() {
    setOpen(false);
    onCheckout();
  }

  function openCart() {
    setOpen(false);
    onOpenCart();
  }

  const chips = [
    starred.length && { label: "⭐ Destaques", run: () => showLocal(starred, { user: "Ver os destaques", reply: "Esses são os queridinhos da casa:" }) },
    ...categories.slice(0, 4).map((c) => ({
      label: c,
      run: () => showLocal(items.filter((it) => it.category === c), { user: `Ver ${c}`, reply: `Algumas opções de ${c}:` }),
    })),
    { label: "O que você recomenda?", run: () => send("O que você recomenda?") },
  ].filter(Boolean);

  const bubbleAssistant = { backgroundColor: translucid, color: foreground };
  const bubbleUser = { backgroundColor: accent, color: onAccent };

  const panel = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Atendente virtual">
      <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
      <div
        className="relative w-full max-w-[440px] sm:max-w-[600px] h-[min(700px,calc(100dvh-24px))] sm:h-[min(820px,calc(100dvh-48px))] rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        style={{ backgroundColor: bgColor, color: foreground, animation: "fadeSlideIn .22s ease-out" }}
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: translucid }}>
          <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: accent, color: onAccent }}>
            <FaMagic />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight truncate">Atendente virtual</p>
            <p className="text-xs truncate" style={{ color: gray }}>
              {menu.title} · {storeOpen ? "aberto agora" : "fechado agora"}
            </p>
          </div>
          {cartCount > 0 && (
            <button
              onClick={openCart}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold hover:opacity-90"
              style={bubbleUser}
              aria-label="Ver carrinho"
            >
              <FaShoppingCart /> {cartCount} · {formatCurrency(cartTotal, menu.currency)}
            </button>
          )}
          <button onClick={() => setOpen(false)} className="cursor-pointer rounded-lg px-2 py-1 text-lg hover:opacity-70" aria-label="Fechar atendente">
            ✕
          </button>
        </div>

        {/* Conversa */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
          <div className="max-w-[85%] rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm" style={bubbleAssistant}>
            {greeting}
          </div>
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c.label}
                  onClick={c.run}
                  className="cursor-pointer px-3 py-1.5 rounded-full text-sm border hover:opacity-80"
                  style={{ borderColor: accent, color: foreground }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md px-3.5 py-2.5 text-sm whitespace-pre-line" style={bubbleUser}>
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="space-y-2">
                {m.content && (
                  <div
                    className="max-w-[85%] rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm whitespace-pre-line"
                    style={m.error ? { ...bubbleAssistant, border: "1px solid #ef444480" } : bubbleAssistant}
                  >
                    {m.content}
                  </div>
                )}
                {m.notes?.map((n, j) => (
                  <p key={j} className="text-xs font-semibold" style={{ color: n.error ? "#ef4444" : accent }}>
                    {n.error ? "⚠ " : "✓ "}
                    {n.text}
                  </p>
                ))}
                {m.cards?.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto snap-x scroll-px-1 px-1 pb-1">
                    {m.cards.map((ref) => {
                      const it = findMenuItem(menu, ref);
                      return it ? (
                        <ItemCard key={ref} item={it} {...{ menu, canShowPromoPrice, accent, onAccent, gray, translucid }} onAdd={() => quickAdd(it)} />
                      ) : null;
                    })}
                  </div>
                )}
                {m.checkout && i === messages.length - 1 && (
                  <CheckoutCard items={cartItems} total={cartTotal} {...{ menu, accent, onAccent, gray, translucid, storeOpen }} onCheckout={storeOpen ? checkout : openCart} />
                )}
              </div>
            ),
          )}

          {loading && (
            <div className="inline-flex gap-1 rounded-2xl rounded-tl-md px-4 py-3" style={bubbleAssistant} aria-label="Digitando">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: gray, animationDelay: `${d}ms` }} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Entrada */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t"
          style={{ borderColor: translucid }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            placeholder="Ex.: quero 2 hambúrgueres e uma coca"
            className="flex-1 min-w-0 rounded-full px-4 py-2.5 text-sm outline-none border"
            style={{ backgroundColor: translucid, color: foreground, borderColor: translucid }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="cursor-pointer w-10 h-10 shrink-0 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            style={bubbleUser}
            aria-label="Enviar"
          >
            <FaPaperPlane />
          </button>
        </form>
        <p className="text-[10px] text-center pb-2 -mt-1" style={{ color: gray }}>
          Atendente com IA. Confira o pedido antes de finalizar.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-full font-bold shadow-lg hover:opacity-90 transition"
        style={{ backgroundColor: foreground, color: bgColor }}
        aria-label="Pedir com o atendente virtual"
      >
        <FaMagic />
        <span>Atendente</span>
      </button>
      {open && mounted && createPortal(panel, document.body)}
    </>
  );
}

function ItemCard({ item, menu, canShowPromoPrice, accent, onAccent, gray, translucid, onAdd }) {
  const img = isUrl(item.thumb_url) ? item.thumb_url : isUrl(item.image_url) ? supabaseImg(item.image_url, { width: 320, height: 320, quality: 75 }) : null;
  const vars = item.variations?.options || [];
  const price = vars.length ? Math.min(...vars.map((o) => Number(o.price || 0))) : itemPrice(item, canShowPromoPrice);
  const promo = !vars.length && item.promo_price && canShowPromoPrice;
  return (
    <div className="snap-start shrink-0 w-40 rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: translucid }}>
      {img ? (
        <Image src={img} alt={item.name} width={320} height={320} className="w-40 h-32 object-cover" />
      ) : (
        <div className="w-40 h-32 flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: `${accent}30`, color: accent }}>
          {item.name?.[0]}
        </div>
      )}
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-sm font-semibold leading-tight line-clamp-2">{item.name}</p>
        {item.description && (
          <p className="text-xs leading-snug line-clamp-2" style={{ color: gray }}>
            {item.description}
          </p>
        )}
        <div className="mt-auto pt-1">
          {promo && (
            <span className="text-xs line-through mr-1" style={{ color: gray }}>
              {formatCurrency(item.price, menu.currency)}
            </span>
          )}
          <span className="text-sm font-bold">
            {vars.length > 0 && <span className="text-xs font-normal">a partir de </span>}
            {formatCurrency(price, menu.currency)}
          </span>
        </div>
        <button onClick={onAdd} className="cursor-pointer mt-1 py-1.5 rounded-full text-xs font-bold hover:opacity-90" style={{ backgroundColor: accent, color: onAccent }}>
          {needsChoice(item) ? "Escolher" : "Adicionar"}
        </button>
      </div>
    </div>
  );
}

function CheckoutCard({ items, total, menu, accent, onAccent, gray, translucid, storeOpen, onCheckout }) {
  if (!items.length) {
    return (
      <p className="text-sm" style={{ color: gray }}>
        Seu carrinho está vazio por enquanto.
      </p>
    );
  }
  return (
    <div className="rounded-2xl p-3.5 border-2" style={{ borderColor: accent, backgroundColor: translucid }}>
      <p className="font-bold mb-2">Seu pedido</p>
      <ul className="space-y-1.5 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex justify-between gap-3">
            <span className="min-w-0">
              {it.qty}x {it.name}
              {it.additionals?.length > 0 && (
                <span className="block text-xs" style={{ color: gray }}>
                  {it.additionals.map(addonName).join(", ")}
                </span>
              )}
            </span>
            <span className="shrink-0">{formatCurrency(lineTotal(it), menu.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-bold mt-3 pt-2 border-t" style={{ borderColor: gray }}>
        <span>Subtotal</span>
        <span>{formatCurrency(total, menu.currency)}</span>
      </div>
      <p className="text-xs mt-1" style={{ color: gray }}>
        Entrega, cupom e forma de pagamento na próxima tela.
      </p>
      <button
        onClick={onCheckout}
        className="cursor-pointer w-full mt-3 py-2.5 rounded-full font-bold hover:opacity-90"
        style={{ backgroundColor: accent, color: onAccent }}
      >
        {storeOpen ? "Finalizar pedido" : "Ver carrinho (loja fechada)"}
      </button>
    </div>
  );
}
