import { CURRENCIES, DEFAULT_CURRENCY } from "@/consts/currencies";

const SYMBOLS = Object.fromEntries(CURRENCIES.map((c) => [c.code, c.symbol]));

// Moedas sem subdivisão decimal — não exibir centavos (ex.: ¥ 1.200, não ¥ 1.200,00)
const ZERO_DECIMAL = new Set(["JPY", "CLP", "PYG", "VND", "KRW"]);

export function getCurrencySymbol(currency) {
  return SYMBOLS[currency] || SYMBOLS[DEFAULT_CURRENCY];
}

/**
 * Formata um valor monetário trocando APENAS o símbolo da moeda.
 * O número continua no formato brasileiro (1.234,56). Sem conversão.
 */
export function formatCurrency(value, currency = DEFAULT_CURRENCY) {
  const n = Number(value);
  const amount = Number.isFinite(n) ? n : 0;
  const digits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  return `${getCurrencySymbol(currency)} ${amount.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}
