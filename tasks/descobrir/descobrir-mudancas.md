# Mudanças: Descobrir, conta do cliente e carrinho

Tudo o que mudou nesta leva, agrupado pelo tipo de mudança. Plano e decisões em `tasks/descobrir/descobrir-plan.md`; tarefas
em `tasks/descobrir/descobrir-todo.md`.

## Antes de publicar (ordem)
1. Rodar no SQL Editor do Supabase de produção, nesta ordem:
   1. `tasks/descobrir/descobrir.sql`
   2. `tasks/descobrir/profile-address.sql`
   3. `tasks/descobrir/orders-customer.sql` (mexe em RLS de `orders`: revisar antes)
2. Preencher as coordenadas dos cardápios que já existem:
   `node --env-file=.env.local scripts/backfill-menu-coords.mjs` (com o `.env` apontando para produção).
3. Conferir os fluxos manuais da seção "Como testar".

---

## 1. Banco de dados (SQL manual)

| Arquivo | O que faz | Sem ele |
|---|---|---|
| `tasks/descobrir/descobrir.sql` | `menus.lat`, `menus.lng` (coordenadas da loja) e `menus.discoverable boolean default true` | Trocar o endereço no painel falha; `/descobrir` dá erro |
| `tasks/descobrir/profile-address.sql` | `profiles.address_details jsonb` + `grant update` da coluna | O endereço não vai para a conta (segue só no aparelho) |
| `tasks/descobrir/orders-customer.sql` | `orders.customer_id` (FK `auth.users`, `on delete set null`), índice parcial `(customer_id, created_at desc) where customer_id is not null`, policy de insert com `customer_id is null or = auth.uid()` e policy de select do próprio cliente | O pedido é gravado sem o cliente (não se perde) e não entra no histórico |

Nenhuma policy foi alterada fora desses arquivos. As policies do dono e da equipe em `orders` não mudaram.

**Só no projeto de teste:** os buckets `menus` e `product-images` não existiam, por isso o upload de foto falhava. O
SQL dos buckets foi passado na conversa e não é arquivo do projeto, porque a produção já tem os buckets.

## 2. Lógica e backend

- **Busca e ordem de Descobrir**: `src/lib/discover.js` (novo), uma função pura `searchMenus`.
  - Filtros (sem acento e sem maiúscula): `q` (nome do estabelecimento ou nome/descrição de produto), `local` (bairro,
    cidade ou UF) e `km` (só com a coordenada do cliente).
  - Ordem: região (mesma cidade → mesmo estado → resto) → nota → distância → nome. Máximo de 50 resultados.
  - Nota: média bayesiana com `C = 3,5` e `M = 5`. Sem avaliação, a loja fica com a nota neutra `C`. Hoje todas
    empatam. Detalhes em `tasks/descobrir/descobrir-avaliacoes.md`.
- **Rota `GET /api/descobrir`**: `src/app/api/descobrir/route.js` (novo).
  - Usa `supabaseAdmin`. Só entram cardápios com `discoverable = true`, cidade no endereço, pelo menos 1 produto
    visível e dono sem exclusão pedida e que não seja conta cliente.
  - Cache em memória: 10 min em produção, nenhum em dev.
  - Devolve só `slug, title, logo_url, banner_url`, bairro, cidade, UF e distância. Nunca `owner_id`, telefone, plano
    ou pix.
- **Coordenadas da loja**: `src/app/dashboard/StatesManager.jsx`.
  - Ao salvar, quando o endereço mudou, geocodifica com `geocodeAddress` (Nominatim) e grava `lat`/`lng`.
  - Se o mapa não achar o endereço, usa o ponto da taxa por raio; sem ele, grava `null` e o save segue normal.
  - Novo campo `discoverable` no estado, enviado só quando muda.
- **Endereço do cliente na conta**: `saveProfileAddress` em `src/lib/queries/profiles.js` grava `address_details` e
  `cep`.
  - Ordem de leitura em `/descobrir`, `/conta` e no carrinho: aparelho → conta → CEP do cadastro.
  - Salvar grava nos dois lugares.
  - Endereço que está só no aparelho é levado para a conta quando o cliente abre `/descobrir` logado.
- **Histórico de pedidos no banco**:
  - `CartDrawer.jsx` grava `customer_id` do cliente logado nos pedidos de mesa e de "site + WhatsApp". No balcão não
    grava.
  - `insertOrder`: se o banco recusar só por causa do `customer_id` (`PGRST204`, `42703` ou `42501`), grava de novo
    sem ele, para o pedido nunca se perder.
  - O comprovante local e o pedido usam a mesma data (`orderCreatedAt`), para o histórico juntar os dois sem repetir.
  - `OrdersHistory.jsx` lê `orders` do cliente, 20 por vez, só com as colunas que mostra. Junta os comprovantes do
    aparelho que não estão no banco: pedidos antigos e de cardápio "só WhatsApp".
- **Preenchimento do pedido**: `CartDrawer.jsx`.
  - O cliente logado recebe nome, telefone e endereço da conta quando o aparelho não tem.
  - Não vale no balcão nem para dono logado.
  - O efeito só roda de novo quando a conta muda, para não apagar o que o cliente está digitando.
- **Redirecionamento**: em `LandingPageV2.jsx`, o cliente logado que abre `/` vai para `/descobrir` (no navegador).
  Dono e visitante continuam na landing, e o HTML do servidor continua sendo a landing (SEO).

## 3. Interface

- **Tela `/descobrir`**: `src/app/descobrir/page.jsx` e `layout.js` (metadata), ambos novos.
  - Header com logo, "Entrar" (visitante) ou menu da conta (cliente) e troca de tema.
  - Linha "Perto de: … · trocar" ou o botão "Informar meu endereço".
  - Busca por comida ou nome, campo de cidade ou bairro e seletor de distância (qualquer, 2, 5, 10 ou 25 km). O seletor
    só aparece com localização.
  - Estado vazio com "Ver qualquer distância".
  - **Card**: metade de cima com a faixa do banner (neutra sem banner) e, embaixo, a foto da loja sobre a faixa, o nome,
    bairro · cidade - UF e a distância.
  - **Modal de endereço**: usa o `AddressFields` com "Usar minha localização". Abre sozinho só para o logado sem
    endereço.
- **Voltar ao topo**: `src/components/ScrollToTopButton.jsx` (novo), usado em `/descobrir` e na landing (`LandingPageV2.jsx`). Botão redondo com seta no
  canto inferior direito.
  - Aparece depois de rolar 400px e leva ao topo com rolagem suave.
  - É instantâneo para quem pediu ao sistema menos movimento.
- **Painel**: toggle "Aparecer em Descobrir" em Configurações > Informações básicas, abaixo do Endereço
  (`ConfigMenu.jsx`). Ligado por padrão e listado em "alterações não salvas".
- **Navbar**:
  - Link "Descobrir" (bússola) no header da landing para visitante e cliente. No celular aparece só o ícone.
  - Item "Descobrir estabelecimentos" no menu da conta (`CustomerMenu.jsx`), que também aparece nos cardápios
    públicos.
- **Cadastro**: o CEP vem preenchido com o que o visitante informou neste aparelho (`register/page.jsx`).
- **`/conta` > Histórico**: texto "Seus pedidos, em qualquer aparelho em que você estiver logado", nome do cardápio
  vindo do banco e o botão "Ver mais pedidos".

## 4. Correções de bugs

- **Carrinho zerava ao sair e voltar para a loja**: `src/contexts/CartContext.js`.
  - O efeito de salvar rodava na primeira renderização e gravava o carrinho vazio por cima do salvo. No dev, o
    StrictMode lia de novo já vazio.
  - Agora o estado tem `hydrated`, e nada é gravado antes de o carrinho salvo ser lido.
- **Endereço sumia ao limpar o cache**: ficava só no `localStorage`. Agora também fica na conta
  (`profiles.address_details`).
- **Histórico sumia ao limpar o cache**: mesmo motivo. Agora vem de `orders.customer_id`.
- **Imagens não apareciam em `/descobrir` no dev**: o cache de 10 min da rota guardava a lista de antes do upload.
  Agora não há cache fora da produção.

## 5. Scripts (novos, rodam fora do app)

- `scripts/backfill-menu-coords.mjs`: preenche `lat`/`lng` dos cardápios sem coordenada.
  - Usa o ponto da taxa por raio quando existe; senão, o Nominatim a 1 req/s com `User-Agent` do Bite Menu.
  - Pode rodar de novo sem refazer nada.
- `scripts/discover-check.mjs`: self-check com assert da busca e da ordem (`node scripts/discover-check.mjs`).

## 6. Documentação

- `tasks/descobrir/descobrir-plan.md`: plano, decisões, riscos e o SQL pendente.
- `tasks/descobrir/descobrir-todo.md`: tarefas 1 a 9 com critérios de aceite.
- `tasks/descobrir/descobrir-avaliacoes.md`: como a nota entra na ordem e o que fazer quando existir avaliação.
- `tasks/descobrir/descobrir-mudancas.md`: este arquivo.
- `tasks/` reorganizado em pastas por funcionalidade (`descobrir/`, `login-usuario/`, `identidade-visual/`,
  `seguranca/`, `sql/`, `archive/`), com índice em `tasks/README.md`. Só `.md` e `.sql` foram movidos; o resto
  (como `brand-bite-menu/`) ficou na raiz de `tasks/`. As referências no código e nos docs foram atualizadas.

---

## Limites conhecidos

- O Nominatim às vezes não acha o endereço. A loja sem coordenada aparece, mas sem distância e fora do filtro de km.
- O cache de 10 min em produção faz com que o toggle, a foto e o endereço novos demorem até 10 min para aparecer em
  Descobrir. Ele é em memória e supõe uma instância só, como o rate limit do `proxy.js`.
- Pedido de cardápio "só WhatsApp" não vai para o banco, então fica só no aparelho. Pedido apagado pelo dono some do
  histórico do cliente.
- O "Meus pedidos" dentro do cardápio público (`MyOrdersModal`) continua lendo só do aparelho.
- Nome e telefone de entrega continuam salvos só no aparelho. Na conta ficam os do cadastro.
- O cliente logado vê a landing por um instante antes de ir para `/descobrir`.

## Como testar

1. **Descobrir:** visitante sem modal; cliente sem endereço com modal; busca por produto; filtro de distância; 360px
   e desktop, nos temas claro e escuro.
2. **Painel:** trocar o endereço grava `lat`/`lng`; desligar "Aparecer em Descobrir" tira a loja da lista.
3. **Conta:** salvar o endereço, limpar o cache e logar de novo deve abrir `/descobrir` sem modal e com o endereço em
   Dados pessoais.
4. **Pedidos:** fazer um pedido logado, limpar o cache e logar de novo; o pedido aparece em `/conta` > Histórico uma
   vez só.
5. **Carrinho:** adicionar itens, sair e voltar para a loja; os itens continuam lá.
6. **Navegação:** em `/`, cliente vai para `/descobrir`; dono e visitante veem a landing.
