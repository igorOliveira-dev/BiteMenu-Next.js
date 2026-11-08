# Tarefas: layout personalizado

- [x] `src/lib/customLayout.js`: blocos, padrão dos templates, normalização, sanitização, CSS
- [x] `scripts/custom-layout-check.mjs` (self-check da sanitização)
- [x] `ClientMenuCustom.jsx` + `page.jsx` + prévia (`custom_draft`)
- [x] Rota da IA `/api/assistant/layout`
- [x] Aba "Layout personalizado" no dashboard; card "Personalizado" no ConfigMenu quando em uso
- [x] Prévia sob demanda (modal), status imediato ao publicar/tirar do cardápio
- [x] Prompt com direção de arte, organização e "sem espaço vazio"; correção automática de contraste
- [x] Coluna única obrigatória, produto em destaque pelo sistema, cores por `colors`
- [x] Painel no modelo de editor de tema (lista + Configurações/Código)
- [x] **Manual:** rodar `layout-personalizado.sql` no SQL Editor (rodado em 08/11; o layout já carregou do banco)
- [ ] Testar com admin: publicar, voltar ao padrão, prévia celular/computador, pedido completo pelo layout novo
- [ ] Testar a IA: cada estilo pronto, pedido numa seção só, pedido vago; conferir custo no log (effort medium)
- [ ] Conferir o painel com login (não foi visto renderizado, só o cardápio/prévia)
