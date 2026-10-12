// Mensagem de confirmação do WhatsApp personalizável pelo dono.
// O texto (rótulos, emojis, ordem) é livre, mas as tags obrigatórias nunca
// saem da mensagem: se o dono apagar alguma, a linha padrão dela vai pro final.
// Linhas cujas tags ficaram vazias (ex.: "Frete: {frete}" na retirada) somem.

export const WHATSAPP_TAGS = [
  { tag: "{itens}", label: "Itens do pedido", line: "{itens}" },
  { tag: "{subtotal}", label: "Subtotal", line: "Subtotal: {subtotal}" },
  { tag: "{desconto}", label: "Desconto (se houver)", line: "Desconto: -{desconto}" },
  { tag: "{cupom}", label: "Cupom (se houver)", line: "Cupom: {cupom}" },
  { tag: "{frete}", label: "Frete (só entrega)", line: "Frete: {frete}" },
  { tag: "{total}", label: "Total", line: "Total: {total}" },
  { tag: "{nome}", label: "Nome do cliente", line: "Nome: {nome}" },
  { tag: "{telefone}", label: "Telefone do cliente", line: "Telefone: {telefone}" },
  { tag: "{bairro}", label: "Bairro (só entrega)", line: "Bairro: {bairro}" },
  { tag: "{endereco}", label: "Endereço (só entrega)", line: "Endereço: {endereco}" },
  { tag: "{pagamento}", label: "Forma de pagamento", line: "Pagamento: {pagamento}" },
  { tag: "{troco}", label: "Troco (se pedido)", line: "Troco para: {troco}" },
  { tag: "{servico}", label: "Tipo de serviço", line: "Serviço: {servico}" },
  { tag: "{estabelecimento}", label: "Nome do estabelecimento", optional: true },
];

export const DEFAULT_WHATSAPP_TEMPLATE = `Pedido de {estabelecimento}

{itens}

————————————
Subtotal: {subtotal}
Desconto: -{desconto}
Cupom: {cupom}
Frete: {frete}
Total: {total}

Nome: {nome}
Telefone: {telefone}
Bairro: {bairro}
Endereço: {endereco}
Pagamento: {pagamento}
Troco para: {troco}
Serviço: {servico}`;

const TAG_REGEX = /\{(\w+)\}/g;

export function missingWhatsappTags(template) {
  return WHATSAPP_TAGS.filter((t) => !t.optional && !template.includes(t.tag));
}

export function renderWhatsappMessage(template, values) {
  let text = template?.trim() ? template : DEFAULT_WHATSAPP_TEMPLATE;

  const missing = missingWhatsappTags(text);
  if (missing.length) text += `\n\n${missing.map((t) => t.line).join("\n")}`;

  return text
    .split("\n")
    .filter((line) => {
      const keys = [...line.matchAll(TAG_REGEX)].map((m) => m[1]).filter((k) => k in values);
      return !keys.length || keys.some((k) => values[k]);
    })
    .join("\n")
    .replace(TAG_REGEX, (match, key) => (key in values ? String(values[key] ?? "") : match));
}
