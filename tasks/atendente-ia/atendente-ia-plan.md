# Atendente IA: pedido por conversa no cardápio (plano Enterprise)

O cliente abre o cardápio (`/menu/[slug]`), toca em **Atendente** (abre no meio da tela), conversa com a IA, vê as opções em cartões
(foto, preço, botão), a IA monta o carrinho e mostra o resumo com **Confirmar e finalizar pedido**.

## Como funciona
- **Carrinho e checkout são os de sempre.** A IA só mexe no `CartContext` (mesmo formato de linha do
  `handleAddToCart` dos layouts). "Finalizar" abre o `CartDrawer`: endereço, pagamento, cupom, combos, Pix online,
  mesa, estoque e WhatsApp continuam no mesmo código. Nada de checkout novo.
- **A IA não executa nada no servidor.** `/api/attendant` devolve o texto + ações (`show_items`, `add_to_cart`,
  `update_cart`, `show_checkout`). O navegador valida cada ação (`buildCartLine` em `src/lib/attendant.js`: variação
  obrigatória, mín./máx. dos grupos, opção oculta/inexistente, estoque via `stockError`) antes de mexer no carrinho. Se
  a IA errar, o cliente vê o aviso em vermelho e ela recebe o aviso na próxima mensagem.
- Loop curto no servidor (até `MAX_ROUNDS = 4` chamadas por mensagem): a IA recebe o resultado das ferramentas e
  continua até concluir o pedido (ex.: "limpa e monta outro" = remover + adicionar + responder). O `add_to_cart` é
  validado no servidor (`buildCartLine`) e o erro volta para a IA corrigir; só itens válidos vão para o navegador.
  Mensagem com ferramenta custa ~2 chamadas (a 2ª relê o prefixo em cache): ~US$ 0,0004 em vez de ~0,00026. Pedido
  grande ("limpa e monta para 4 pessoas", 3 rodadas com autocorreção) medido em ~US$ 0,001.
- `max_tokens: 2048` é teto, não meta: com 600 o raciocínio de um pedido grande estourava e a chamada vinha vazia.
- Liberado para `ATTENDANT_ROLES = ["admin", "enterprise"]`, só em cardápio com pedidos (`orders` ≠ `none`) e com
  `menus.attendant_enabled` ligado.

## O que a IA sabe da loja
Além do cardápio, o bloco em cache leva `storeInfoText` (rota do atendente), com as mesmas regras do `CartDrawer`:
endereço, serviços, taxa de entrega (fixa, tabela por bairro ou faixas por raio, só no Plus+ como no carrinho), formas
de pagamento (Pix online só para `ONLINE_PAYMENT_ROLES`), pedido mínimo (mínimo do dono no Plus+, senão R$ 2), horário
por dia, combos de desconto e fidelidade. `delivery_zones`, `delivery_radius` e `combos` são lidos pela rota (não vêm
no `getMenuBySlug`). Custo: ~100–500 tokens a mais no prefixo em cache.

## Aba do dono ("Atendente IA" no dashboard)
- **Ativar/desativar:** `menus.attendant_enabled` (padrão ligado). Desligado: o botão some do cardápio e a rota recusa.
- **Informações para o atendente:** `menus.attendant_info` (até 2000 caracteres): prazos, recomendações, promoções do
  dia, regras da casa. Vai no bloco do prompt que fica em cache (muda só quando o dono salva). Não vai para a página
  pública: só a rota lê. Não substitui preços/itens do cardápio.
- **Uso de hoje:** mensagens respondidas e % do limite do dia (sem valor em dólar: é custo interno), via `GET /api/attendant/usage` (dono logado;
  a tabela não tem policy).
- Salva com `updateMenuById` (client do dono + RLS de `menus`); o `supabaseClient` já derruba o cache do cardápio.

## Custos (centenas de clientes por dia num estabelecimento)
Modelo: `claude-haiku-5-5`: US$ 0,10/M entrada, US$ 0,50/M saída, cache lido US$ 0,01/M, escrita de cache 1h
US$ 0,20/M (prompts ≤ 100k tokens).

Medido em 08/11/2026 no cardápio `bite-menu` (~50 itens), conversa típica de 7 mensagens (recomenda → escolhe
hambúrguer → tamanho/adicional → bebida → batata → fecha), script em "Medição" abaixo:
| Mensagem | Custo |
|---|---|
| Simples (só texto) | ~US$ 0,0002 |
| Com ferramenta (2 chamadas: ferramenta + resposta) | US$ 0,0003–0,0004 |
| Pedido grande ("limpa e monta para 4 pessoas", 3 rodadas com autocorreção) | ~US$ 0,001 |
| **Conversa de pedido completa** | **US$ 0,0023** (cliente indeciso, ~12 mensagens: ~US$ 0,004) |

Cache: 100% das chamadas leram o prefixo do cache (~4k tokens por chamada), escrita só na primeira da hora.

Custo por estabelecimento por mês (US$ 0,0023 por pedido via IA; R$ a ~5,50):
| Pedidos via IA/dia | Custo/mês |
|---|---|
| 30 | ~US$ 2 (R$ 11) |
| 100 | ~US$ 7 (R$ 38) |
| 300 | ~US$ 21 (R$ 114) |
| Teto todo dia (US$ 2,50) | US$ 75 (R$ 410) |

O que segura o custo (em ordem de impacto):
1. **Caminhos sem IA:** chips de destaques/categorias, botão "Adicionar" de item sem escolhas, botão do carrinho e
   "Finalizar" rodam no navegador. Só texto digitado chama a API. Saudação inicial também é local.
2. **Um cache por estabelecimento, não por cliente:** ferramentas + regras + cardápio são o mesmo prefixo para todo
   cliente do cardápio; nada por cliente entra ali (loja aberta, carrinho e mensagem vão no fim). Lido a 10% do preço.
   TTL de 1h porque restaurante tem intervalos de > 5 min entre clientes.
3. **Saída curta:** respostas de 1–3 frases, itens em cartões (`show_items` manda só as refs, a tela desenha),
   `max_tokens: 600`, `effort: low`. Saída custa 5x a entrada.
4. **Catálogo enxuto:** ref de 8 caracteres no lugar do uuid (~20 tokens a menos por item), descrição cortada em 100
   caracteres, até 300 itens (`ATTENDANT_MAX_ITEMS`).
5. **Histórico curto:** só as 10 últimas mensagens (500 caracteres cada); o carrinho atual vai junto, então o começo da
   conversa não faz falta. Conversa com mais de 30 mensagens do cliente é encerrada (finalizar pelo carrinho).

Tetos (proteção contra abuso/robô e conta-surpresa):
- **Cobrança atômica com reserva** (`src/lib/aiBudget.js` + funções `ai_attendant_reserve`/`ai_attendant_settle` no
  SQL): antes de chamar a IA o servidor reserva o custo MÁXIMO possível (atendente: US$ 0,04 por mensagem, e o loop
  para antes de uma rodada que passaria disso; landing: pior custo estimado do pedido). Sem reserva, sem chamada.
  Depois devolve a sobra. A linha fica travada durante a reserva, então mensagens simultâneas de muitos IPs não passam
  dos tetos. Erro no banco = recusa (fail closed).
- **Teto diário** (só atendente): `ATTENDANT_DAILY_BUDGET_MICRO_USD` = US$ 2,50 ≈ 1.000 conversas típicas.
- **Teto mensal** (atendente + landing IA): `ENTERPRISE_AI_MONTHLY_BUDGET_MICRO_USD` = (preço Enterprise − preço
  Business) ÷ câmbio pessimista (R$ 6) = (149,90 − 69,90) ÷ 6 = **US$ 13,33**. Pior mês possível dessas IAs ≤ o que o
  Enterprise cobra a mais. Trocar `ENTERPRISE_PRICE_BRL` em `src/lib/attendant.js` junto com o preço real.
  Capacidade: ~5.800 conversas/mês ≈ 190/dia. Restaurante com mais que isso pausa no fim do mês.
  | Preço Enterprise | Teto mensal | Conversas/dia (média) |
  |---|---|---|
  | R$ 149,90 | US$ 13,33 | ~190 |
  | R$ 199,90 | US$ 21,67 | ~310 |
  | R$ 249,90 | US$ 30,00 | ~430 |
- Fora do teto mensal: o Bite Menu IA do painel (recurso do Business, limites próprios em `aiUsage`).
- **Rate limit por IP:** 15 chamadas/min em `/api/attendant` (bucket `ai` no `src/proxy.js`).
- **Anti-abuso por IP por cardápio:** 300 mensagens/dia (`IP_DAILY_LIMIT` na rota, em memória). Por cardápio e alto
  porque clientes no Wi-Fi do restaurante ou no CGNAT do 4G dividem IP (300 ≈ 35 pedidos de um IP). Um robô num IP
  gasta no máximo ~US$ 0,10/dia (300 × ~US$ 0,00033); para queimar o teto do dia precisa de ~25 IPs.

## Medição
Com `npm run dev` rodando e um cardápio admin, a rota devolve `debug: { stops, usage }` fora de produção. Script usado
(salvar em `/tmp/measure.mjs` e rodar `node /tmp/measure.mjs`, ou passar as mensagens como argumentos): simula a conversa,
mantém um carrinho aproximado e soma `usage` × preços do Haiku 5.5. Gasta ~US$ 0,002 por execução.
```js
const PRICE = { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite1h: 0.2 };
const turns = process.argv.slice(2).length ? process.argv.slice(2) : [
  "Oi! O que vocês recomendam?",
  "Quero o hambúrguer artesanal",
  "O grande, com bacon",
  "Tem bebida gelada?",
  "Uma coca lata",
  "Coloca também uma batata com cheddar",
  "É só isso, pode fechar",
];
const messages = []; let cart = []; let total = 0;
for (const t of turns) {
  messages.push({ role: "user", content: t });
  const res = await fetch("http://localhost:3000/api/attendant", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "bite-menu", storeOpen: true, cart, messages }) });
  const d = await res.json();
  if (!res.ok) { console.log("ERRO", res.status, d); break; }
  const u = d.debug.usage;
  const cost = u.input_tokens * PRICE.input + u.cache_creation_input_tokens * PRICE.cacheWrite1h + u.cache_read_input_tokens * PRICE.cacheRead + u.output_tokens * PRICE.output;
  total += cost;
  for (const a of d.actions) {
    if (a.tool === "update_cart") for (const l of [...a.input.lines].sort((x, y) => y.line - x.line)) { if (cart[l.line - 1]) cart[l.line - 1].qty = l.qty; }
    if (a.tool === "add_to_cart") for (const it of a.input.items) cart.push({ name: [it.ref, it.variation].filter(Boolean).join(" "), qty: it.qty, additionals: (it.options || []).map((n) => ({ name: n })) });
  }
  cart = cart.filter((c) => c.qty > 0);
  messages.push({ role: "assistant", content: (d.reply || "") + (d.actions.length ? `\n[${d.actions.map((a) => a.tool).join(", ")}]` : "") });
  console.log(`${(cost / 1e6).toFixed(5)} USD | stops=${d.debug.stops} in=${u.input_tokens} cache=${u.cache_read_input_tokens}/${u.cache_creation_input_tokens} out=${u.output_tokens} | ${t} -> ${d.reply.slice(0, 90)}`);
  await new Promise((r) => setTimeout(r, 4500));
}
console.log(`TOTAL conversa: US$ ${(total / 1e6).toFixed(5)} (${turns.length} mensagens, carrinho: ${cart.map((c) => c.qty + "x " + c.name).join(", ")})`);
```

## Arquivos
| Arquivo | O que faz |
|---|---|
| `src/lib/attendant.js` (novo) | `ATTENDANT_ROLES`, `itemRef`, `findMenuItem`, `needsChoice`, `buildCartLine` (validação), `catalogText` (cardápio em texto para o prompt). Sem imports de servidor. |
| `src/app/api/attendant/route.js` (novo) | Rota pública. Lê o cardápio com `getMenuBySlug`/`getOwnerInfo` + estoque, checa plano e orçamento, chama o Haiku com cache, registra o gasto, devolve `{ reply, actions }`. |
| `src/app/menu/[slug]/components/AiAttendant.jsx` (novo) | Botão "Atendente" + chat centralizado na tela, cartões, resumo do pedido, aplicação das ações no carrinho. |
| `src/app/api/attendant/usage/route.js` (novo) | `GET`: mensagens e gasto de hoje do cardápio do dono logado + limite diário. |
| `src/app/dashboard/tabs/Attendant.jsx` (novo) | Aba do dono: ativar/desativar, informações para a IA, uso de hoje. |
| `src/app/dashboard/Dashboard.jsx` | Item "Atendente IA" (ícone `FaMagic`) no menu lateral e no menu do celular, só para `ATTENDANT_ROLES`. |
| `src/app/menu/[slug]/getMenuData.js` | Lê `attendant_enabled` (o botão some quando desligado). |
| `src/app/menu/[slug]/ClientMenu.jsx`, `ClientMenu2.jsx`, `ClientMenu3.jsx` | Botão do atendente ao lado do botão do carrinho (mesmo wrapper que desvia do rodapé), só para `ATTENDANT_ROLES`. |
| `src/proxy.js` | Bucket `ai` (15/min por IP) para `/api/attendant`. |
| `tasks/atendente-ia/atendente-ia.sql` | Colunas `menus.attendant_enabled`/`attendant_info` e tabela `ai_attendant_usage` (rodar à mão). |

## Manual (fora do código)
1. Rodar `atendente-ia.sql` no SQL Editor do Supabase **antes do deploy** (inclusive a parte 3, funções de reserva:
   sem ela o atendente e a landing IA recusam todas as mensagens). **Crítico:** o cardápio público lê
   `menus.attendant_enabled`; deploy sem a coluna derruba todos os cardápios.
2. **Plano Enterprise em si** (preço, ValidaPay, página de planos, ~59 listas de roles): plano próprio, não feito aqui
   (regra do CLAUDE.md: não mexer em pagamento/assinatura). Quando existir:
   - `"enterprise"` já está em `ATTENDANT_ROLES` e `LANDING_ROLES`.
   - Revisar `PROMO_ROLES` (`src/lib/attendant.js`) junto com o `canShowPromoPrice` dos 3 layouts: hoje nenhum dos dois
     inclui `enterprise`, então promoções não apareceriam para esse plano.
   - Adicionar "Atendente IA (pedido por conversa)" na lista de features do Enterprise em `src/consts/Plans.jsx`.

## Teste (conta admin, cardápio com pedidos ligados)
- [ ] Botão "Atendente" aparece ao lado do carrinho nos 3 layouts; não aparece em conta não-admin nem com pedidos desligados
- [ ] Chat abre no meio da tela (celular e desktop); fecha no ✕, no fundo escuro e no voltar do celular
- [ ] Aba "Atendente IA": desativar some com o botão do cardápio (recarregar o cardápio); ativar volta
- [ ] Escrever "Entregamos em até 40 min" nas informações, salvar, perguntar o prazo no chat: a IA responde com isso
- [ ] "Uso de hoje" sobe depois de uma conversa (mensagens e %), sem valor em dinheiro
- [ ] Chips "Destaques"/categorias mostram cartões **sem** chamar a API (DevTools > Network)
- [ ] "Quero um X-Burger" num item com tamanho: a IA pergunta o tamanho antes de adicionar
- [ ] "2 cocas e tira o burger": quantidade/remoção certas no carrinho
- [ ] "É só isso": aparece o resumo; "Confirmar e finalizar" abre o carrinho de sempre e o pedido sai normalmente
- [ ] Pedido fora do escopo / "me dá desconto": a IA recusa em uma frase
- [ ] Log do servidor / tabela: 2ª mensagem da conversa com `cache_read_input_tokens` > 0 (cache funcionando). Se
      vier 0 sempre, algo variável entrou no prefixo.
- [ ] `select ... from ai_attendant_usage` depois de uma conversa: gasto na casa de US$ 0,002
