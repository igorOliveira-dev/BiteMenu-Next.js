# Tarefas: registro e login de usuário comum

Plano em `tasks/login-usuario-plan.md`.

## Tarefa 1: SQL da coluna `account_type` (manual)

**Descrição:** Criar `tasks/account-type.sql` com a coluna nova em `profiles`. O usuário roda no Supabase.

```sql
alter table profiles add column if not exists account_type text not null default 'owner'
  check (account_type in ('owner', 'customer'));
```

**Critérios de aceite:**
- [ ] A coluna existe e as contas antigas aparecem como `owner`
- [ ] O insert do navegador aceita a coluna (o arquivo inclui `grant insert (account_type)`, porque o security-2 libera colunas uma a uma)
- [ ] O cadastro atual de estabelecimento continua funcionando

**Verificação:**
- [ ] Manual: `select account_type, count(*) from profiles group by 1;`

**Depende de:** nada
**Arquivos:** `tasks/account-type.sql`
**Tamanho:** XS

## Tarefa 2: Abas no registro

**Descrição:** Dois botões no topo do card ("Estabelecimento" / "Cliente"), dentro do container que já existe. O título
e o texto lateral mudam conforme a aba. A aba inicial vem de `?tipo=cliente`.

**Critérios de aceite:**
- [ ] Alternar não perde o que já foi digitado
- [ ] A aba de estabelecimento se comporta exatamente como hoje
- [ ] Funciona no celular (container de 350px)

**Verificação:**
- [ ] `npm run build` e `npm run lint` passam
- [ ] Manual: alternar as abas no desktop e no celular

**Depende de:** nada
**Arquivos:** `src/app/register/page.jsx`
**Tamanho:** S

## Tarefa 3: Cadastro de cliente funcionando

**Descrição:** No ramo de cliente do `handleSignUp`: inserir com `account_type: 'customer'`, sem `acquisition_source`, e
redirecionar para o destino do cliente (pergunta 1 do plano). O `gtag` `sign_up` ganha o tipo de conta.

**Critérios de aceite:**
- [ ] Cliente cadastrado aparece em `profiles` com `customer`
- [ ] Cliente não passa pelo `/getstart`
- [ ] O aceite de privacidade é gravado igual (`privacy_acceptances`)

**Verificação:**
- [ ] `npm run build` passa
- [ ] Manual: cadastrar um cliente e conferir a linha no Supabase

**Depende de:** 1, 2
**Arquivos:** `src/app/register/page.jsx`
**Tamanho:** S

## Checkpoint 1
- [ ] `npm run build` e `npm run lint` passam
- [ ] Cadastro manual dos dois tipos funciona
- [ ] As linhas em `profiles` estão corretas
- [ ] Revisão com o usuário antes de seguir

## Tarefa 4: Login respeita o tipo de conta

**Descrição:** Depois do login, buscar `account_type` e mandar o cliente para o destino dele em vez de `/getstart`.
Barrar cliente em `/getstart` e `/dashboard`, com redirecionamento. **Toca autenticação:** mostrar o diff e esperar
aprovação antes de aplicar (CLAUDE.md).

**Critérios de aceite:**
- [ ] O cliente cai no destino dele após o login
- [ ] O cliente não consegue abrir `/getstart` nem `/dashboard`
- [ ] Um dono existente não percebe nenhuma diferença

**Verificação:**
- [ ] `npm run build` passa
- [ ] Manual: login com conta de dono e com conta de cliente

**Depende de:** 3
**Arquivos:** `src/app/login/page.jsx`, `src/app/getstart/page.jsx`
**Tamanho:** S

## Checkpoint 2
- [ ] O login dos dois tipos cai no lugar certo
- [ ] Os fluxos de dono (getstart, dashboard, assinatura) não mudaram

## Tarefa 5: Banco recusa cardápio de conta cliente (manual)

**Descrição:** O redirecionamento do `/getstart` é só na tela; o navegador ainda consegue inserir em `menus`. O trigger em
`tasks/account-type-menu-guard.sql` recusa insert (ou troca de `owner_id`) quando o dono tem `account_type = 'customer'`.

**Critérios de aceite:**
- [ ] Insert em `menus` com `owner_id` de cliente falha com "Conta de cliente não pode criar cardápio"
- [ ] Dono continua criando cardápio pelo `/getstart` normalmente

**Verificação:**
- [ ] Manual: rodar o teste comentado no fim do SQL e criar um cardápio com conta de dono

**Depende de:** 1
**Arquivos:** `tasks/account-type-menu-guard.sql`
**Tamanho:** XS

## Fase 2: área do cliente (feito)

## Tarefa 6: Círculo da conta na navbar
- [x] `src/components/CustomerMenu.jsx`: avatar com a inicial e as opções Perfil, Histórico de pedidos e Sair
- [x] `src/components/ActionMenu.jsx`: aceita `children` como botão (os usos antigos não mudam)
- [x] `LandingPageV2.jsx`: mostra o círculo só para conta de cliente

## Tarefa 7: Página `/conta` com barra lateral
- [x] `src/app/conta/page.jsx`: Perfil, Dados pessoais e Histórico de pedidos; abre por `?aba=`
- [x] `Account.jsx`: esconde Plano e Equipe para cliente; texto de exclusão sem falar de cardápio
- [x] Informações de pagamento removida (não há dado salvo para mostrar)

## Tarefa 8: CEP no cadastro de cliente
- [x] Campo CEP (formato `00000-000`, obrigatório) só na aba Cliente; grava `profiles.cep`
- [x] Já preenche o CEP nos dados de entrega do aparelho (`customerInfo`)
- [ ] Rodar `tasks/profile-cep.sql` no Supabase antes de publicar

## Tarefa 9: Dados pessoais preenchidos
- [x] `PersonalInfo.jsx`: completa com nome, telefone e CEP do cadastro; o endereço vem do ViaCEP

## Tarefa 10: Botão de conta nos cardápios
- [x] `menu/[slug]/components/MenuAccountButton.jsx`: "Entrar" para visitante, círculo para cliente, nada para dono
- [x] Login e cadastro repassam `?tipo=` e `?next=`; Sair recarrega a página atual

## Tarefa 11: Link do estabelecimento no histórico
- [x] Pedidos novos gravam `menuSlug` (`CartDrawer.jsx`); os antigos buscam o slug em `menus`
- [x] O link abre em nova guia

## Tarefa 12: Centralização em telas grandes
- [x] `/conta`: conteúdo centralizado (`mx-auto`, até 812px)
- [x] Dashboard: abas sem painel à direita centralizadas (`Dashboard.jsx`)

## Checkpoint 3 (manual)
- [ ] Rodar os 3 SQL (`account-type`, `account-type-menu-guard`, `profile-cep`)
- [ ] Cadastro e login de cliente pelo cardápio voltam para ele
- [ ] `/conta`: as 3 seções funcionam no desktop e no celular
- [ ] Dashboard centralizado num monitor grande, e Cardápio/Pedidos sem mudança
