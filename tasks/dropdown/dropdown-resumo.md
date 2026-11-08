# Resumo: dropdowns no visual do Bite Menu

Todos os `<select>` nativos do app viraram o componente `src/components/Select.jsx`, no mesmo visual do seletor
"No Descobrir, abrir primeiro" (`tasks/landing-ia/landing-descobrir-plan.md`). A lista nativa ficava branca no tema
escuro e fora do estilo do painel.

## O componente
```jsx
<Select
  value={status}
  onChange={setStatus}            // recebe o value, não o evento
  className={fieldClass}          // vai no botão: cada uso mantém o próprio tamanho
  options={[{ value: "all", label: "Todos" }, { value: "x", label: "X", hint: "descrição opcional", disabled: true }]}
/>
```
- `hint` é opcional: só usar quando a opção precisa de explicação (hoje só o "abrir primeiro").
- Largura igual à do `<select>` nativo: os rótulos ficam empilhados invisíveis e o botão reserva a largura do maior.
- Lista em portal com `position: fixed`: não é cortada por `overflow` de modal; abre para cima sem espaço embaixo;
  mínimo de 180 px, presa à tela.
- Teclado: setas, Enter/Espaço, Esc (fecha só a lista, não o modal) e Tab.
- Sem `value`, é não controlado (`defaultValue` ou a 1ª opção). Com `name`, manda o valor num `<input hidden>`
  (formulários lidos por `FormData`).
- Clicar numa opção não fecha o `GenericModal`: ele só fecha com clique no próprio fundo.

## Onde foi trocado
| Arquivo | Selects |
|---|---|
| `src/app/dashboard/tabs/components/menu/DiscoverOpenSelect.jsx` | "No Descobrir, abrir primeiro" (agora usa o `Select`) |
| `src/app/dashboard/tabs/components/orders/OrdersFilter.jsx` | Serviço, pagamento, pago/não pago, status |
| `src/app/dashboard/tabs/Orders.jsx` | Entregador do pedido; serviço e pagamento na edição |
| `src/app/dashboard/tabs/Sales.jsx` | Serviço e pagamento na edição |
| `src/app/dashboard/tabs/components/print/PrintDocumentButton.jsx` | Tipo da impressão e formato do papel |
| `src/app/dashboard/tabs/Stock.jsx` | Categoria e status |
| `src/app/dashboard/tabs/Team.jsx` | Função |
| `src/app/descobrir/page.jsx` | Distância máxima |

**Fora:** `src/app/dashboard/tabs/components/OnlinePayment.jsx` (cadastro na ValidaPay; o `CLAUDE.md` não deixa
mexer na integração do gateway). A troca é pequena, porque o `Select` já aceita `name` para o `FormData`; fazer só
com o ok do dono.

Ficam como estão os selects com busca (`src/components/SearchSelect.jsx` e o `SearchSelect` de `ConfigMenu.jsx`):
já tinham o visual do painel.

## Verificado
- [x] `npm run build`
- [x] Fake-supabase (cópia do projeto em :3100): status do Descobrir nos temas claro e escuro, escolha por mouse e
  teclado, Esc fecha só a lista, escolha gravada; Estoque com a largura do maior rótulo
- [ ] Manual: filtros de Pedidos, edição de pedido/venda, modal de impressão, Equipe e Descobrir no celular
