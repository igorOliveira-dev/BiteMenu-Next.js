# Tarefas: status de Descobrir no banner

## Tarefa 1: Botão + modal de status ✅
- [x] Opção desligada: bolinha cinza, "Fora do Descobrir", botão "Ativar em Configurações"
- [x] Opção ligada e todas as regras ok: bolinha verde, "No Descobrir"
- [x] Opção ligada sem cidade / sem link / sem produto visível: bolinha amarela, "Não aparece", e a caixa explica o motivo
- [x] Não sobrepõe o botão de abertura da loja no celular (só bolinha + ícone)

## Tarefa 2: Atalho para resolver cada motivo ✅
- [x] Sem cidade: "Corrigir endereço" abre modal com CEP; salvar grava e o status vira "sim" (conferido no fake-supabase)
- [ ] Sem link: "Definir link em Configurações" abre Informações básicas com o campo do link focado
- [x] Dono com exclusão de conta pedida: status não aparece

**Verificação:**
- [x] `npm run build`
- [x] Fake-supabase: endereço antigo → amarelo → corrigir endereço → verde; celular 390px sem sobreposição
- [ ] Manual: desligar/ligar pelo switch do modal do status e conferir que o toggle de Configurações acompanha
- [ ] Manual em produção: ocultar todos os produtos

**Arquivos:** `src/app/dashboard/tabs/components/menu/DiscoverStatus.jsx`, `src/app/dashboard/tabs/Menu.jsx`
