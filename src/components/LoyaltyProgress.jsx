// Linha tracejada da fidelidade: 1 traço = 1 compra, mais o texto indicativo. state = loyaltyState(...) ({ done, ready }).
// Sem `colors`: identidade do Bite Menu (azul = andamento, verde = prêmio liberado).
// Com `colors` ({ text, muted, track, accent }): cores do cardápio.
// inOpenOrder: prêmio liberado e já há pedido em aberto, que é onde o prêmio vale.
export default function LoyaltyProgress({ state, goal, reward, colors, inOpenOrder = false }) {
  const { done, ready } = state;
  const missing = goal - done;

  const fill = (filled) =>
    colors
      ? { className: "", style: { backgroundColor: filled ? colors.accent : colors.track } }
      : {
          className: filled ? (ready ? "bg-st-done" : "bg-info") : "bg-[var(--translucid)]",
          style: undefined,
        };

  return (
    <div>
      <div
        role="progressbar"
        aria-label="Progresso na fidelidade"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={done}
        className="flex gap-1"
      >
        {Array.from({ length: goal }, (_, i) => {
          const { className, style } = fill(i < done);
          return <span key={i} className={`h-2 flex-1 rounded-full ${className}`} style={style} />;
        })}
      </div>
      <p
        className={`mt-2 text-sm ${colors ? "" : ready ? "text-st-done" : "color-gray"}`}
        style={colors ? { color: ready ? colors.text : colors.muted } : undefined}
      >
        {ready && inOpenOrder ? (
          <>
            <strong>Prêmio em uso!</strong> Seu <strong>{reward}</strong> já está valendo no pedido em aberto. Quando
            ele for concluído, você volta a juntar compras.
          </>
        ) : ready ? (
          <>
            <strong>Prêmio liberado!</strong> Na sua próxima compra você ganha <strong>{reward}</strong>.
          </>
        ) : (
          <>
            {done} de {goal} compras · {missing === 1 ? "falta 1" : `faltam ${missing}`} para ganhar{" "}
            <strong>{reward}</strong>
          </>
        )}
      </p>
    </div>
  );
}
