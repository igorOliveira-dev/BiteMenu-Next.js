import { formatCurrency } from "@/lib/formatCurrency";
import { getContrastTextColor } from "@/utils/color";

// Variação do item (ex: Tamanho): cliente escolhe uma, o preço dela substitui o do item.
// Sem onSelect = só exibe (cardápio sem pedidos).
export default function VariationPicker({ variations, selected, onSelect, currency, accent, foreground, gray, translucid }) {
  const options = variations?.options || [];
  if (!options.length) return null;

  return (
    <div className="rounded-xl p-3 mb-2" style={{ border: `2px solid ${accent}`, backgroundColor: translucid }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-lg" style={{ color: foreground }}>
          {variations.name}
        </span>
        {onSelect && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: accent, color: getContrastTextColor(accent) }}>
            Escolha 1
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {options.map((o, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(i)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-left ${onSelect ? "cursor-pointer" : ""}`}
              style={{
                color: foreground,
                border: `1px solid ${isSelected ? accent : `${gray}55`}`,
                backgroundColor: isSelected ? `${accent}33` : "transparent",
              }}
            >
              <span className="flex items-center gap-2">
                {onSelect && (
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ border: `2px solid ${isSelected ? accent : gray}`, backgroundColor: isSelected ? accent : "transparent" }}
                  />
                )}
                <span className="font-medium">{o.name}</span>
              </span>
              <span className="font-semibold">{formatCurrency(o.price, currency)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
