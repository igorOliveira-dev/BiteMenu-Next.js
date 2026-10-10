# Todo: horários convertidos pro fuso do cliente

## Task 1: Helpers de conversão em storeHours.js
**Descrição:** Adicionar `zoneOffset(timeZone, date)` (minutos em relação ao UTC, via `Intl`, com fallback pro
`DEFAULT_TIMEZONE`) e `shiftTime("HH:MM", diffMin)` (soma minutos e dá a volta em 24h).

**Critérios de aceite:**
- [x] `zoneOffset("America/Sao_Paulo") === -180`, `zoneOffset("America/Manaus") === -240`
- [x] `shiftTime("18:00", -60) === "17:00"`, `shiftTime("23:30", 60) === "00:30"`, `shiftTime("00:30", -60) === "23:30"`
- [x] Funções existentes (`isOpenNow` etc.) inalteradas

**Verificação:**
- [x] `node --input-type=module` com os asserts acima passa
- [ ] `npm run build` passa

**Dependências:** nenhuma
**Arquivos:** `src/utils/storeHours.js`
**Tamanho:** XS

## Task 2: Conversão no ClientMenu (tema padrão)
**Descrição:** Ler o fuso do cliente após o mount; se o offset diferir do da loja, converter o texto do topo
(`closingTime`, `nextOpenInfo.time`) e as faixas do modal de horários (`formatHours`), e mostrar o aviso no modal.

**Critérios de aceite:**
- [ ] Loja em `America/Sao_Paulo`, navegador em `America/Manaus`: "Aberto até às 22:00h" vira "21:00h" e o modal mostra as faixas -1h + aviso
- [ ] Mesmo offset (ou mesmo fuso): nada muda, sem aviso
- [ ] Sem warning de hidratação no console

**Verificação:**
- [ ] `npm run build` passa
- [ ] Manual: skill `run-bitemenu` com `TZ`/fuso do navegador trocado, screenshot do topo e do modal

**Dependências:** Task 1
**Arquivos:** `src/app/menu/[slug]/ClientMenu.jsx`
**Tamanho:** S

## Task 3: Mesma conversão no ClientMenu2 e ClientMenu3
**Descrição:** Replicar exatamente a mudança da Task 2 nos outros dois temas.

**Critérios de aceite:**
- [ ] Mesmo comportamento da Task 2 nos dois temas
- [x] Diff equivalente ao do ClientMenu (mesmos nomes e textos)

**Verificação:**
- [ ] `npm run build` passa
- [ ] Manual: abrir uma loja de cada tema com o fuso trocado

**Dependências:** Task 2
**Arquivos:** `src/app/menu/[slug]/ClientMenu2.jsx`, `src/app/menu/[slug]/ClientMenu3.jsx`
**Tamanho:** S

## Checkpoint: completo
- [ ] Build limpo
- [ ] Os 3 temas convertem com fuso diferente e ficam iguais com o mesmo fuso
- [ ] Aberto/fechado continua certo (usa o fuso da loja)
- [ ] `graphify update .`
- [ ] Revisão sua antes do commit
