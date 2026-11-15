// Insights com IA no Dashboard de vendas (tasks/insights-ia/insights-ia-plan.md).
// summarizeSales é puro (sem imports): resume as vendas para o prompt. Self-check: node scripts/sales-insights-check.mjs
export const INSIGHTS_ROLES = ["admin", "enterprise"];
export const INSIGHTS_MIN_SALES = 5;
export const INSIGHTS_MAX_ROWS = 5000; // ponytail: amostra das mais recentes; agregar no SQL se precisar do período todo

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "numeric", hourCycle: "h23" });
const EN_DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Dia da semana (0 = dom) e hora no horário de Brasília
export function brParts(iso) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { day: EN_DAYS[p.weekday], hour: Number(p.hour) };
}

const money = (n) => Math.round(n * 100) / 100;
export const lineValue = (it) =>
  ((Number(it.price) || 0) + (it.additionals || []).reduce((s, a) => s + (Number(a.price) || 0), 0)) * (Number(it.qty) || 0);

function totals(sales) {
  const faturamento = sales.reduce((s, x) => s + (Number(x.total) || 0), 0);
  return { vendas: sales.length, faturamento: money(faturamento), ticketMedio: sales.length ? money(faturamento / sales.length) : 0 };
}

// sales: { created_at, total, service, items_list, costumer_phone }
// menu: { categories: [{ name, menu_items: [{ id, name, price, promo_price, image_url, description, starred, visible }] }] }
// Saída sem nome nem telefone de cliente: só contagens.
export function summarizeSales(sales, prevSales, menu) {
  const catalog = (menu?.categories || []).flatMap((c) =>
    (c.menu_items || []).filter((it) => it.visible !== false).map((it) => ({ ...it, category: c.name })),
  );
  const byId = new Map(catalog.map((it) => [it.id, it]));
  const keyOf = (it) => (it.id && byId.has(it.id) ? it.id : `n:${it.name}`);
  const nameOf = (key, it) => byId.get(key)?.name ?? it.name;

  const days = WEEKDAYS.map((dia) => ({ dia, vendas: 0, faturamento: 0 }));
  const hours = {};
  const services = {};
  const products = new Map();
  const pairs = new Map();
  const customers = new Map();

  for (const s of sales) {
    const total = Number(s.total) || 0;
    const { day, hour } = brParts(s.created_at);
    days[day].vendas++;
    days[day].faturamento += total;
    hours[hour] ??= { hora: hour, vendas: 0, faturamento: 0 };
    hours[hour].vendas++;
    hours[hour].faturamento += total;
    if (s.service) services[s.service] = (services[s.service] || 0) + 1;

    const inSale = new Map();
    for (const it of s.items_list || []) {
      const key = keyOf(it);
      const p = products.get(key) ?? { nome: nameOf(key, it), qtd: 0, faturamento: 0, comAdicional: 0 };
      const qty = Number(it.qty) || 0;
      p.qtd += qty;
      p.faturamento += lineValue(it);
      if (it.additionals?.length) p.comAdicional += qty;
      products.set(key, p);
      inSale.set(key, p.nome);
    }
    const names = [...inSale.values()].sort();
    for (let i = 0; i < names.length; i++)
      for (let j = i + 1; j < names.length; j++) {
        const k = `${names[i]}\u0000${names[j]}`;
        pairs.set(k, (pairs.get(k) || 0) + 1);
      }

    const who = String(s.costumer_phone ?? "").replace(/\D/g, ""); // customer_id só existe com o SQL da fidelidade
    if (who) customers.set(who, (customers.get(who) || 0) + 1);
  }

  const repeat = [...customers.values()].filter((n) => n > 1);
  const sold = new Set([...products.keys()]);

  return {
    periodo: totals(sales),
    periodoAnterior: totals(prevSales || []),
    amostra: sales.length >= INSIGHTS_MAX_ROWS,
    porDiaSemana: days.map((d) => ({ ...d, faturamento: money(d.faturamento) })),
    porHora: Object.values(hours).sort((a, b) => a.hora - b.hora).map((h) => ({ ...h, faturamento: money(h.faturamento) })),
    porServico: services,
    produtos: [...products.values()]
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 30)
      .map((p) => ({ nome: p.nome, qtd: p.qtd, faturamento: money(p.faturamento), pctComAdicional: p.qtd ? Math.round((p.comAdicional / p.qtd) * 100) : 0 })),
    vendidosJuntos: [...pairs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, pedidos]) => ({ itens: k.split("\u0000"), pedidos })),
    naoVenderam: catalog
      .filter((it) => !sold.has(it.id))
      .slice(0, 30)
      .map((it) => ({ nome: it.name, categoria: it.category, preco: Number(it.price) || 0, foto: !!it.image_url, descricao: !!it.description?.trim(), destaque: !!it.starred })),
    destaques: catalog.filter((it) => it.starred).map((it) => ({ nome: it.name, qtd: products.get(it.id)?.qtd ?? 0 })),
    promocoes: catalog
      .filter((it) => it.promo_price != null && it.promo_price !== "")
      .map((it) => ({ nome: it.name, preco: Number(it.price), promo: Number(it.promo_price), qtd: products.get(it.id)?.qtd ?? 0 })),
    clientes: {
      identificados: customers.size,
      recorrentes: repeat.length,
      pctVendasDeRecorrentes: sales.length ? Math.round((repeat.reduce((a, b) => a + b, 0) / sales.length) * 100) : 0,
    },
  };
}
