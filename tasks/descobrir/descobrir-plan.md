# Plano: descobrir estabelecimentos perto do cliente

## Visão geral
Nova tela `/descobrir` onde o cliente vê os estabelecimentos que usam o Bite Menu perto do endereço dele, do mais
perto para o mais longe. Ele pode buscar por comida, por nome do estabelecimento e por localização (cidade ou bairro)
e limitar a distância máxima. Se ele não tiver endereço salvo, um modal pede o endereço logo ao abrir a tela.
A navbar ganha um link para a tela, e o cliente logado que abre `/` vai direto para `/descobrir`.

Tarefas em `tasks/descobrir/descobrir-todo.md`.

**Fora do escopo:** mapa, avaliações, filtros por categoria/preço, paginação, "aberto agora", ordenação além da distância.

## Como está hoje (lido no código)
- **Distância e geocodificação já existem** em `src/lib/deliveryRadius.js`: `distanceKm` (haversine),
  `geocodeAddress` (Nominatim, ~1 req/s, sem chave) e `currentPosition` (GPS do navegador).
- **Endereço do estabelecimento:** `menus.address` (texto) e `menus.address_details` (`{cep, street, number,
  neighborhood, city, state}`, formato do `AddressFields`). Gravado em `src/app/dashboard/StatesManager.jsx:453`.
  **Não há lat/lng da loja**, só `delivery_radius.lat/lng` para quem usa taxa por raio.
- **Endereço do cliente:** fica no aparelho, em `localStorage.customerInfo.addressParts` (mesma chave do carrinho e de
  `/conta` > Dados pessoais). No banco só existe `profiles.cep`. `PersonalInfo.jsx` já junta os dois e completa pelo ViaCEP.
- **Login é só no navegador** (`supabase-js` com sessão em localStorage, `useUser`). O servidor e o `proxy.js` não sabem
  quem está logado, então o redirecionamento de `/` tem que ser no cliente.
- **Navbar:** o header fica dentro de `src/app/landingPage/LandingPageV2.jsx:166`. Cliente vê `CustomerMenu`
  (Perfil, Histórico, Sair); `/conta` tem a própria barra.
- `menus` não tem grant por coluna (só `profiles` tem), então colunas novas em `menus` o dono já consegue gravar.

## Decisões
- **Coordenadas da loja em colunas novas `menus.lat` e `menus.lng`** (SQL manual em `tasks/descobrir/descobrir.sql`).
  Preenchidas quando o dono salva o endereço (`geocodeAddress(addressDetails)` no save do `StatesManager`) e, para os
  cardápios que já existem, por um script único de backfill (Nominatim, 1 por segundo).
  Sem coordenada, o estabelecimento ainda aparece, mas só na busca por texto, sem distância.
- **Lista vem de uma rota do servidor `GET /api/descobrir`** com `supabaseAdmin`: lê os cardápios uma vez (cache de
  10 min em memória, a produção roda numa instância só, igual ao rate limit do `proxy.js`), descarta dono com exclusão
  pedida e conta cliente, filtra e ordena por distância, devolve no máximo 50. Cada item: `slug, title, logo_url,
  address (cidade/bairro), distância`. Nunca devolve telefone, `owner_id` nem plano.
  - Por que servidor: a busca por comida precisa dos nomes de todos os `menu_items`; mandar tudo para o navegador pesa.
  - Parâmetros: `lat`, `lng`, `q` (nome do estabelecimento **ou** nome/descrição de produto), `local` (cidade/bairro),
    `km` (distância máxima). Busca sem acento e sem maiúsculas.
- **Endereço do cliente:** mesma ordem do `PersonalInfo`: `customerInfo.addressParts` → `profiles.cep`. Sem nenhum,
  abre modal com o `AddressFields` que já existe; ao salvar, grava em `customerInfo` (o carrinho e `/conta` passam a
  usar o mesmo endereço). Botão "Usar minha localização" como alternativa (`currentPosition`).
  A coordenada do cliente fica em cache em `localStorage.discoverCoords` (`{ source, lat, lng }`, `source` = endereço
  formatado ou `"gps"`), para não chamar o Nominatim a cada visita. Chave própria porque o carrinho regrava
  `customerInfo` inteiro e apagaria um campo extra.
- **Visitante deslogado:** vê estabelecimentos de todo lugar, sem modal obrigatório. Um botão "Informar meu endereço"
  abre o mesmo modal (`AddressFields` + "Usar minha localização") e grava em `customerInfo`; a partir daí ele tem a
  mesma ordem por região do logado. Se depois ele se cadastrar como cliente, o CEP do cadastro já vem preenchido com o
  de `customerInfo` (o resto do endereço já está no aparelho e o `/conta` e o carrinho leem dali).
- **Ordem da lista (`sortMenus` em `src/lib/discover.js`):** região (mesma cidade → mesmo estado → resto, só com
  endereço) → nota (preparada, ainda vazia; ver `tasks/descobrir/descobrir-avaliacoes.md`) → distância, ou nome sem coordenada.
  Cidade e estado vêm do `addressParts` do cliente comparados com `menus.address_details` (sem acento/caixa).
- **Distância:** padrão "qualquer distância", para a região sempre aparecer primeiro começando pela cidade. Opções 2,
  5, 10, 25 km; com zero resultados, o estado vazio oferece voltar para "qualquer distância".
- **Quais cardápios entram:** `discoverable = true`, endereço preenchido e pelo menos 1 produto visível, plano grátis
  incluído.
- **Toggle do dono:** "Aparecer em Descobrir" na config do cardápio (`ConfigMenu`), ligado por padrão, gravado em
  `menus.discoverable` pelo save que já existe no `StatesManager`.
- **Redirecionamento de `/`:** só para `account_type = 'customer'`, no cliente (`router.replace('/descobrir')` na
  `LandingPageV2` quando `useUser` termina). Dono logado continua vendo a landing com "Acessar cardápio".
  A landing segue no HTML do servidor para SEO; o cliente logado vê um piscar curto antes de trocar.
- **Link na navbar:** "Descobrir" ao lado do `CustomerMenu` na landing e item "Descobrir estabelecimentos" dentro do
  `CustomerMenu` (aparece também no cardápio público e onde mais ele for usado).

## Lista de tarefas
- [x] Tarefa 1: SQL das colunas `lat`/`lng`/`discoverable` (escrito; rodar manualmente: `tasks/descobrir/descobrir.sql`)
- [x] Tarefa 2: Dono grava lat/lng ao salvar o endereço e tem o toggle "Aparecer em Descobrir" (código pronto; conferir no painel após o SQL)
- [x] Tarefa 3: Backfill dos cardápios existentes (script pronto; rodar após o SQL: `node --env-file=.env.local scripts/backfill-menu-coords.mjs`)
- [ ] Checkpoint 1: cardápios com coordenadas no banco
- [x] Tarefa 4: Rota `GET /api/descobrir` (self-check: `node scripts/discover-check.mjs`)
- [x] Tarefa 5: Tela `/descobrir` com endereço do cliente e modal
- [x] Tarefa 6: Busca e filtro de distância na tela (feita junto com a 5, mesmo arquivo)
- [ ] Checkpoint 2: fluxo de ponta a ponta
- [x] Tarefa 7: Link na navbar
- [x] Tarefa 8: Cliente logado em `/` vai para `/descobrir`
- [x] Tarefa 9: Cadastro de cliente já vem com o CEP informado em Descobrir
- [ ] Checkpoint 3: pronto para revisão

### SQL pendente (rodar no Supabase antes de publicar)
- [ ] `tasks/descobrir/descobrir.sql`: colunas `menus.lat`, `menus.lng`, `menus.discoverable`
- [ ] `tasks/descobrir/profile-address.sql`: coluna `profiles.address_details` + grant de update
- [ ] `tasks/descobrir/orders-customer.sql`: coluna `orders.customer_id` + índice parcial + policies de insert/select (**mexe em RLS de orders: revisar antes**)

### Ajuste depois do checkpoint 3
- [x] Endereço do cliente salvo também na conta (`profiles.address_details`). Leitura: aparelho → conta → CEP. Salvar em
  `/descobrir` ou em `/conta` > Dados pessoais grava nos dois; endereço do aparelho sem cópia na conta é levado para ela
  ao abrir `/descobrir` logado (cobre o visitante que se cadastrou depois).
- [x] Histórico de pedidos no banco: `orders.customer_id` (sem copiar o pedido). O carrinho grava o id do cliente logado
  (fora do balcão); se o banco recusar por coluna/policy ausente, grava de novo sem ele. `/conta` > Histórico lê
  `orders` do cliente (20 por vez, "Ver mais") e junta os comprovantes do aparelho que não estão no banco (pedidos
  antigos e de cardápio "só WhatsApp"), sem repetir: o comprovante e o pedido usam a mesma data.
  Limites aceitos: pedido de cardápio "só WhatsApp" fica só no aparelho; pedido apagado pelo dono some do histórico.

## Riscos
| Risco | Impacto | Como evitar |
|---|---|---|
| Nominatim não acha o endereço (ou bloqueia por volume) | Médio | Cai para o centro do CEP (já faz); loja sem coordenada só aparece na busca por texto; backfill a 1 req/s |
| Dono não quer aparecer na lista | Médio | Sem opção por ora; coluna `discoverable` se alguém pedir |
| Cardápio abandonado/vazio poluindo a lista | Médio | Só entra com endereço + 1 produto visível |
| Rota pública vira raspagem da base de clientes do Bite Menu | Baixo | Só dados que o cardápio já mostra em público; rate limit do `proxy.js` já cobre `/api/` |
| Cache em memória quebra com mais de uma instância | Baixo | Mesmo pressuposto do `proxy.js`; comentário `shortcut:` na rota |
| Muitos cardápios deixam a rota lenta | Baixo | Cache de 10 min; trocar por PostGIS/RPC se passar de alguns milhares |
| Piscar da landing antes do redirect | Baixo | Não renderizar o hero enquanto `loading` for true para cliente com sessão salva (só se incomodar) |

## Perguntas em aberto
1. ~~Todo estabelecimento aparece?~~ **Decidido:** sim por padrão, com toggle do dono (`menus.discoverable`).
   Deslogado sem endereço vê de todo lugar; com endereço (logado ou não), cidade → estado → resto.
2. ~~Quais cardápios contam?~~ **Decidido:** endereço preenchido + 1 produto visível, plano grátis incluído.
3. ~~Distância padrão?~~ **Decidido:** "qualquer distância", com opções 2, 5, 10, 25 km.
4. ~~Avaliações?~~ **Decidido:** a ordenação já considera nota; sistema de avaliação fica para depois
   (`tasks/descobrir/descobrir-avaliacoes.md`).
