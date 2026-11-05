# Tarefas: descobrir estabelecimentos

Plano e decisões em `tasks/descobrir/descobrir-plan.md`. Não há suíte de testes no projeto: a verificação é `npm run lint`,
`npm run build` e conferência manual. Lógica nova não trivial (filtro/ordenação da rota) leva um self-check com assert.

## Fase 1: coordenadas das lojas

## Tarefa 1: SQL das colunas `lat`/`lng`/`discoverable` (manual) ✅ escrito

**Descrição:** `tasks/descobrir/descobrir.sql` adiciona `menus.lat`, `menus.lng` (`double precision`) e
`menus.discoverable boolean not null default true`. Supabase é alteração manual: o arquivo é rodado no SQL Editor pelo
dono do projeto.

**Critérios de aceite:**
- [x] Arquivo com `begin/commit` e consulta de conferência comentada, no padrão de `tasks/login-usuario/profile-cep.sql`
- [x] Nenhuma policy ou grant alterado (menus não tem grant por coluna)

**Verificação:**
- [ ] Manual: rodado no Supabase; a consulta de conferência do fim do arquivo funciona

**Dependências:** Nenhuma
**Arquivos:** `tasks/descobrir/descobrir.sql`
**Escopo:** XS

## Tarefa 2: Dono grava lat/lng ao salvar o endereço e tem o toggle "Aparecer em Descobrir" ✅ código

**Descrição:** No save do cardápio (`StatesManager.jsx`, onde já monta `address`/`address_details`), quando
`addressDetails` mudou, chamar `geocodeAddress(addressDetails)` e incluir `lat`/`lng` no update. Falha de geocodificação
não bloqueia o save (grava `null`). Novo estado `discoverable` (lido de `menus.discoverable`, padrão `true`) salvo no
mesmo update, com um toggle "Aparecer em Descobrir" em `ConfigMenu.jsx` no estilo dos toggles que já existem lá.

**Critérios de aceite:**
- [ ] Salvar um endereço novo grava `lat`/`lng` corretos (conferir no Google Maps)
- [ ] Salvar sem mudar o endereço não chama o Nominatim
- [ ] Endereço não encontrado: o save funciona igual a hoje
- [ ] Desligar o toggle e salvar grava `discoverable = false`; recarregar o painel mostra desligado

**Verificação:**
- [ ] `npm run lint` e `npm run build`
- [ ] Manual: trocar o endereço e o toggle no painel e conferir a linha em `menus`

**Dependências:** Tarefa 1
**Arquivos:** `src/app/dashboard/StatesManager.jsx`, `src/app/dashboard/tabs/ConfigMenu.jsx`
**Escopo:** S

## Tarefa 3: Backfill dos cardápios existentes ✅ script

**Descrição:** Script único `scripts/backfill-menu-coords.mjs` (service role via env, roda local) que pega os cardápios
com `address_details` e sem `lat`, usa `delivery_radius.lat/lng` quando existir e, senão, geocodifica a 1 por segundo.
Imprime quantos achou e quantos falharam.

**Critérios de aceite:**
- [ ] Respeita 1 req/s e manda `User-Agent` identificando o Bite Menu (regra do Nominatim)
- [ ] Pode rodar de novo sem refazer o que já tem coordenada

**Verificação:**
- [ ] Manual: rodar, conferir contagem; amostra de 3 lojas no mapa

**Dependências:** Tarefa 1
**Arquivos:** `scripts/backfill-menu-coords.mjs`
**Escopo:** S

## Checkpoint 1: coordenadas no banco
- [ ] SQL rodado, backfill feito, salvar endereço no painel grava coordenadas
- [ ] Build limpo
- [ ] Revisar com o dono do projeto antes de seguir

## Fase 2: tela de descoberta

## Tarefa 4: Rota `GET /api/descobrir` ✅

**Descrição:** Route handler com `supabaseAdmin`: carrega `menus` (`slug, title, logo_url, address_details, lat, lng`,
nomes e descrições de `menu_items` visíveis) e `profiles` dos donos para descartar `deletion_requested_at` e
`account_type = 'customer'`, e só mantém cardápio com `discoverable = true`, endereço e pelo menos 1 produto visível.
Cache em memória de 10 min. Recebe `lat, lng, cidade, uf, q, local, km`; filtra (sem acento/caixa) e ordena com
`sortMenus`: região (mesma cidade → mesmo estado → resto, só com `cidade/uf`) → nota (`score` bayesiano de
`rating_avg`/`rating_count`, hoje sempre vazio) → distância, ou nome sem coordenada. Regras da nota em
`tasks/descobrir/descobrir-avaliacoes.md`. Devolve até 50 itens sem dados privados.

**Critérios de aceite:**
- [ ] `q=pizza` acha loja pelo nome **e** loja com produto "Pizza ..."
- [ ] Com `cidade/uf`: lojas da mesma cidade antes das do mesmo estado, e essas antes das outras
- [ ] `km=5` com `lat/lng` só devolve lojas até 5 km, ordenadas
- [ ] Sem nenhum parâmetro: lojas de todo lugar, em ordem alfabética
- [ ] Loja com `discoverable = false` nunca aparece
- [ ] Self-check: dentro do mesmo grupo, loja com nota maior vem antes; 1 avaliação 5 não passa 200 avaliações 4,8;
      sem nota vai depois de quem tem nota
- [ ] Resposta não tem `owner_id`, telefone, plano nem `pix_key`

**Verificação:**
- [ ] Self-check com assert da função de filtro/ordenação (executável com `node`)
- [ ] `npm run build`; manual: `curl "/api/descobrir?lat=..&lng=..&q=pizza&km=10"`

**Dependências:** Tarefa 1 (Tarefa 3 para ter dados reais)
**Arquivos:** `src/app/api/descobrir/route.js`, `src/lib/discover.js`, `scripts/discover-check.mjs`
**Escopo:** M

## Tarefa 5: Tela `/descobrir` com endereço do cliente e modal ✅ código

**Descrição:** Página cliente `src/app/descobrir/page.jsx` no visual `brand-scope`. **Visitante deslogado:** sem modal
automático, lista de todo lugar; botão "Informar meu endereço" abre o mesmo modal e grava em `customerInfo` (se já
houver endereço lá, usa direto). **Cliente logado:** lê o endereço
na ordem do `PersonalInfo` (`customerInfo.addressParts` → `profiles.cep` + ViaCEP). Sem endereço: modal com
`AddressFields` e botão "Usar minha localização"; ao salvar, grava em `customerInfo`. Manda `cidade/uf` para a rota. Geocodifica e guarda as coordenadas em `discoverCoords` (chave
própria: o carrinho regrava `customerInfo` inteiro). Mostra "Perto de: <endereço> · trocar" e a lista vinda da rota (logo, nome, bairro/cidade,
"a X km"), cada card linkando para `/menu/<slug>`.

**Critérios de aceite:**
- [ ] Deslogado: nenhum modal automático, lista de todo lugar
- [ ] Deslogado que informa o endereço: passa a ver a cidade dele primeiro, e o endereço continua ao voltar na tela
- [ ] Logado sem endereço salvo: o modal abre sozinho ao abrir a tela
- [ ] Logado com endereço salvo: mesma cidade primeiro, depois mesmo estado, sem modal
- [ ] Endereço salvo aqui aparece em `/conta` > Dados pessoais e no carrinho
- [ ] Endereço não achado no mapa: aviso e lista sem distância (não trava)

**Verificação:**
- [ ] `npm run lint` e `npm run build`
- [ ] Manual: aba anônima (modal), conta de cliente com CEP, celular (largura 360px)

**Dependências:** Tarefa 4
**Arquivos:** `src/app/descobrir/page.jsx`, `src/app/descobrir/layout.jsx` (metadata), talvez `src/app/descobrir/AddressModal.jsx`
**Escopo:** M

## Tarefa 6: Busca e filtro de distância na tela ✅ código

**Descrição:** Campo de busca (comida ou nome), campo de localização (cidade/bairro) e seletor de distância
(qualquer, 2, 5, 10, 25 km; padrão "qualquer", para a região aparecer primeiro começando pela cidade; escondido sem
coordenada). Chama a rota com debounce de ~300 ms. Estado vazio: "Nenhum estabelecimento encontrado por aqui" com
botão "ver qualquer distância".

**Critérios de aceite:**
- [ ] Buscar "hambúrguer" acha produto "Hamburguer" (sem acento)
- [ ] Trocar a distância atualiza a lista
- [ ] Busca por localização funciona mesmo sem endereço do cliente

**Verificação:**
- [ ] `npm run build`; manual com 3 buscas diferentes

**Dependências:** Tarefa 5
**Arquivos:** `src/app/descobrir/page.jsx`
**Escopo:** S

## Checkpoint 2: fluxo de ponta a ponta
- [ ] Cliente novo cadastra, abre `/descobrir`, informa endereço, busca e abre um cardápio
- [ ] Build e lint limpos
- [ ] Revisar com o dono do projeto

## Fase 3: entrada na tela

## Tarefa 7: Link na navbar ✅ código

**Descrição:** Na `LandingPageV2`, link "Descobrir" no header para todos (visitante e cliente; dono continua com
"Acessar cardápio"). No `CustomerMenu`, item "Descobrir estabelecimentos" (vale também no cardápio público).

**Critérios de aceite:**
- [ ] Link visível no desktop e no celular sem quebrar o header (360px)
- [ ] Item novo no menu da conta leva para `/descobrir`

**Verificação:**
- [ ] `npm run build`; manual nas larguras 360px e desktop, tema claro e escuro

**Dependências:** Tarefa 5
**Arquivos:** `src/app/landingPage/LandingPageV2.jsx`, `src/components/CustomerMenu.jsx`
**Escopo:** S

## Tarefa 8: Cliente logado em `/` vai para `/descobrir` ✅ código

**Descrição:** Na `LandingPageV2`, quando `useUser` termina e `isCustomer`, `router.replace("/descobrir")`. Dono e
visitante não mudam. O HTML do servidor continua sendo a landing (SEO e JSON-LD intactos). Conferir que o login de
cliente sem `?next=` (que manda para `/`) passa a cair em `/descobrir` por este caminho, sem mexer no login.

**Critérios de aceite:**
- [ ] Cliente logado abrindo `/` termina em `/descobrir`; o botão "voltar" não prende em loop
- [ ] Dono logado e visitante continuam vendo a landing
- [ ] Logo da navbar em `/descobrir` não leva de volta para a landing num loop

**Verificação:**
- [ ] `npm run build`; manual com as 3 contas (cliente, dono, deslogado)

**Dependências:** Tarefa 5
**Arquivos:** `src/app/landingPage/LandingPageV2.jsx`
**Escopo:** XS

## Tarefa 9: Cadastro de cliente já vem com o CEP informado em Descobrir ✅ código

**Descrição:** Em `src/app/register/page.jsx`, o `cep` começa com `customerInfo.addressParts.cep` quando existir
(leitura em `useEffect`, com try/catch). O resto do endereço já está no aparelho, e o cadastro já completa o
`customerInfo` com o CEP (linha ~144), então `/conta` e o carrinho continuam usando o endereço que ele deu. Não mexe no
`signUp` nem em auth.

**Critérios de aceite:**
- [ ] Visitante informa endereço em `/descobrir`, abre `/register?tipo=cliente`: CEP preenchido
- [ ] Depois do cadastro, `/conta` > Dados pessoais mostra o endereço completo informado antes
- [ ] Sem `customerInfo`, o cadastro fica igual a hoje

**Verificação:**
- [ ] `npm run build`; manual em aba anônima

**Dependências:** Tarefa 5
**Arquivos:** `src/app/register/page.jsx`
**Escopo:** XS

## Checkpoint 3: pronto para revisão
- [ ] Todos os critérios acima marcados
- [ ] `tasks/descobrir/descobrir.sql` rodado antes do deploy
- [ ] `graphify update .`
- [ ] Revisão do dono do projeto
