# Tarefas: landing page gerada por IA

Plano em `tasks/landing-ia/landing-ia-plan.md`. Ordem: segurança da página pública primeiro (maior risco), depois IA,
depois a aba.

**Status (2026-11-07):** Tarefas 1–4 implementadas, `npm run build` ok. Verificado: strip e `edits` (asserts),
`/site/<inexistente>` → 404, `/site/<sem landing>` → 307 para `/menu`, rota de IA sem login → 401.
**Falta o teste manual com conta admin** (gerar, ajustar, publicar, abrir `/site`, conferir CSP no DevTools).
Lógica pura em `src/lib/landing.js` (permissão, CSP, strip, selo, `applyLandingEdits`).

## Tarefa 0 (manual): coluna no Supabase
Rodar `tasks/landing-ia/landing-ia.sql` no SQL Editor:
```sql
alter table public.menus
  add column if not exists landing_html text
  check (landing_html is null or length(landing_html) <= 300000);
```
- [ ] Coluna criada; policy de update de `menus` (dono) continua cobrindo a coluna nova
- [ ] Gravar um HTML de teste à mão no cardápio de uma conta admin

**Dependências:** nenhuma · **Escopo:** XS (1 `.sql`)

## Tarefa 1: página pública `/site/[slug]` segura
**Descrição:** route handler que lê `menus.landing_html` + `role` do dono, limpa o HTML, injeta o selo "Feito com
Bite Menu" e responde com o CSP `sandbox` do plano. Sem landing ou dono fora de `LANDING_ROLES` → redirect para
`/menu/[slug]`. Cria `LANDING_ROLES = ["admin"]` em `src/lib/assistant.js`.

**Critérios de aceite:**
- [ ] `/site/<slug-admin>` mostra o HTML salvo, com o selo no fim
- [ ] HTML com `<script>alert(1)</script>`, `<img onerror=...>` e `<form>` não executa nada (console sem alerta; CSP
      no header da resposta)
- [ ] Slug sem landing, ou de dono não-admin, redireciona para `/menu/<slug>`; slug inexistente → 404

**Verificação:**
- [ ] Self-check com `assert` do strip (script, on*, javascript:) rodando com `node`
- [ ] `npm run build` e `npm run lint`
- [ ] Manual: abrir no navegador, conferir header `Content-Security-Policy` no DevTools

**Dependências:** 0 · **Arquivos:** `src/app/site/[slug]/route.js`, `src/lib/assistant.js` · **Escopo:** S

## Tarefa 2: limite de uso compartilhado
**Descrição:** mover `getUsage`, `addUsage`, `usageInfo` e `SESSION_MS` de `src/app/api/assistant/route.js` para
`src/lib/aiUsage.js`, sem mudar código; a rota atual passa a importar dali.

**Critérios de aceite:**
- [ ] Chat do Bite Menu IA funciona igual: mostra % usado, bloqueia em 100%
- [ ] Nenhuma mudança de comportamento no diff além de mover/importar

**Verificação:** `npm run build`; manual: mandar 1 mensagem no Bite Menu IA e ver o % subir

**Dependências:** nenhuma · **Arquivos:** `src/lib/aiUsage.js`, `src/app/api/assistant/route.js` · **Escopo:** S

## Checkpoint 1
- [ ] Build e lint limpos
- [ ] `/site/[slug]` seguro com HTML de teste; Bite Menu IA atual sem regressão
- [ ] Revisar com o humano antes da IA de landing

## Tarefa 3: rota de IA `/api/assistant/landing`
**Descrição:** POST `{ messages, html }`. Autoriza com `LANDING_ROLES`, checa e soma `ai_usage`, monta o contexto do
cardápio (dados, até 20 produtos, telefone do dono, HTML atual) e chama a Anthropic (`LANDING_MODEL`) com duas
ferramentas: `write_landing({ summary, html })` para criar/refazer e `edit_landing({ summary, edits: [{ find, replace }] })`
para ajustes. O servidor aplica os `edits` tudo ou nada (cada `find` exatamente 1 vez). Devolve
`{ reply, html?, usage }`. `maxDuration = 300`.

**Critérios de aceite:**
- [ ] "Crie uma landing moderna para meu restaurante" devolve HTML completo, sem `<script>`, com logo/banner/produtos
      reais e botão para `/menu/<slug>`
- [ ] "Deixa os botões verdes" usa `edit_landing` e o diff entre o HTML antes/depois só toca nos botões
- [ ] `find` inexistente ou repetido → HTML inalterado e mensagem para o dono reformular
- [ ] Não-admin → 403; sessão em 100% → 429; assunto fora do Bite Menu → recusa curta

**Verificação extra:** self-check com `assert` da função que aplica os `edits` (sucesso, `find` ausente, `find`
repetido, tudo ou nada)

**Verificação:**
- [ ] `npm run build`
- [ ] Manual (curl com token de admin): 3–4 prompts de criação e 3–4 de ajuste, anotar tokens e qualidade
      (subsídio para decidir o modelo depois)

**Dependências:** 1, 2 · **Arquivos:** `src/app/api/assistant/landing/route.js` · **Escopo:** S

## Tarefa 4: aba "Landing page" no dashboard
**Descrição:** `tabs/Landing.jsx` com chat (mensagens + campo), preview em `<iframe sandbox="" srcDoc>`, % de uso,
botões **Publicar** (grava `menus.landing_html` pelo client), **Remover landing** (grava `null`) e **Ver página**
(`/site/<slug>` em nova aba). Item no `navItems` de `Dashboard.jsx` só para `LANDING_ROLES`. Carrega o
`landing_html` salvo ao abrir.

**Critérios de aceite:**
- [ ] Admin vê a aba; outros planos não
- [ ] Gerar → preview atualiza → Publicar → `/site/<slug>` mostra a mesma página
- [ ] Sair da aba com rascunho não publicado avisa (ou mantém o rascunho até recarregar)
- [ ] Funciona no celular (chat e preview empilhados)

**Verificação:** `npm run build`, `npm run lint`; manual: fluxo completo num cardápio admin, desktop e celular

**Dependências:** 3 · **Arquivos:** `src/app/dashboard/tabs/Landing.jsx`, `src/app/dashboard/Dashboard.jsx` ·
**Escopo:** M

## Checkpoint final
- [ ] Fluxo ponta a ponta: pedir → ajustar → publicar → abrir `/site/<slug>` → clicar em "Pedir" → cardápio
- [ ] Conta não-admin: sem aba, `/site` redireciona, rota de IA dá 403
- [ ] `graphify update .`
- [ ] Atualizar `tasks/README.md` com a pasta `landing-ia/`
- [ ] Revisar com o humano
