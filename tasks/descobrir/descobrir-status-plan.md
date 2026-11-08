# Plano: status de Descobrir no banner do painel

## Visão geral
Botão sobre o banner da aba Cardápio (canto superior direito, no estilo do `StoreStatus`, que fica à esquerda)
mostrando se a opção "Aparecer em Descobrir" está ativa e se a loja de fato aparece em `/descobrir`. Se a opção está
ativa mas a loja não aparece, o modal lista os motivos, cada um com o atalho para resolver.

## Decisões
- Componente `src/app/dashboard/tabs/components/menu/DiscoverStatus.jsx`, montado em `Menu.jsx` ao lado do `StoreStatus`.
- Regras iguais às de `src/app/api/descobrir/route.js` (comentário nos dois lados para manter em sincronia):
  opção ativa, endereço com cidade, link (slug), pelo menos 1 produto visível, dono sem exclusão de conta solicitada.
- **Quem vê:** todos os planos (regra atual da rota). O status some só quando o dono pediu exclusão da conta, porque aí
  a loja não pode aparecer de jeito nenhum.
- **Atalho por motivo:**
  - opção desligada: switch "Aparecer em Descobrir" no próprio modal, salvo na hora por `saveAll` (o toggle de Configurações continua lá);
  - sem link → "Definir link em Configurações": abre Informações básicas e rola até o campo do link, já focado
    (`configMenuSection = "basico"` + `configMenuField = "config-slug"`, lidos no `ConfigMenu`);
  - só o motivo ligado a uma configuração tem botão para Configurações; não há botão genérico;
  - endereço sem cidade → modal com `AddressFields` (CEP preenche o resto), salvo por `saveAll`, o mesmo caminho do
    assistente IA (`applyAiChanges`); salva junto as outras alterações pendentes, e o modal avisa isso;
  - sem produto visível → só o texto (resolve na própria aba).
- Não chama `/api/descobrir` (paginada e sem busca por slug): calcula no navegador.
- Campos vêm do estado da edição (`menuState`), como `hours` no `StoreStatus`; com alteração não salva, o modal avisa.
- Produtos visíveis: uma consulta leve (`categories → menu_items(visible)`) ao montar e a cada abertura do modal.
- Aviso de que mudanças levam até 10 min (cache da rota em produção).
- Nada muda em Supabase, RLS ou nas regras da rota.

Tarefas em `tasks/descobrir/descobrir-status-todo.md`.
