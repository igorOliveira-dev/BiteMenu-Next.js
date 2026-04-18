# CLAUDE.md

## Visão geral

O Bite Menu é um SaaS de cardápio digital para restaurantes.

Permite que donos de estabelecimentos:

- criem cardápios com categorias e produtos
- personalizem aparência
- recebam pedidos via WhatsApp e aba “pedidos”
- analisem pedidos e vendas
- gerenciem seu negócio de forma simples

Clientes acessam via `/menu/[slug]` e fazem pedidos diretamente.

O projeto é solo.

---

## Mentalidade do projeto (CRÍTICO)

Sempre priorizar:

- Simplicidade > sofisticação
- Funcionar bem > ser perfeito
- Clareza > design complexo
- Velocidade de desenvolvimento > arquitetura ideal

Evitar:

- overengineering
- abstrações desnecessárias
- refatorações grandes sem motivo
- mudanças que não trazem valor real

Pergunta principal:
"Qual é a solução mais simples que resolve isso bem?"

---

## Como trabalhar neste projeto

Ordem de prioridade:

1. Não quebrar o que já funciona
2. Manter simplicidade
3. Resolver o problema
4. Melhorar código (se necessário)

Ao escrever código:

- Entender como já funciona
- Alterar o mínimo necessário
- Preservar comportamento existente
- Não refatorar partes não relacionadas

Preferir:

- código direto
- soluções práticas
- consistência com o projeto

Evitar:

- reescrever código sem necessidade
- criar abstrações genéricas
- mudar padrões já usados

Regra:

- NÃO sugerir refatorações amplas
- NÃO reorganizar estrutura sem motivo claro
- NÃO complicar o sistema

---

## Limite de atuação (MUITO IMPORTANTE)

NÃO alterar diretamente integrações com:

- Stripe
- Supabase (auth, queries críticas, RLS)

Isso inclui:

- webhooks
- checkout
- lógica de assinatura
- autenticação
- policies

Se necessário:

- explicar o que deve ser alterado
- separar claramente o que é manual vs código

---

## Tech Stack

- Next.js 16 (App Router)
- JavaScript / TypeScript
- Supabase (DB, Auth, Storage)
- Stripe (subscriptions, checkout, webhooks)
- Tailwind CSS
- PWA (`next-pwa`)

Alias:

- `@/*` → `src/*`

---

## Commands

```bash
npm run dev
npm run build
npm run lint
npm start
```
