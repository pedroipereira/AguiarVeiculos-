# Sistema interno Aguiar Veículos — Leads: cards de resumo, abas Funil/Compradores, filtro de mês

## Contexto

Extensão da página `/admin/leads` (sub-projeto 2/6, Leads/CRM, já
implementado e mergeado — o board kanban `LeadKanbanBoard` existe e
funciona). O usuário testou o kanban ao vivo e pediu para a página ganhar
uma camada de visão geral acima do funil: números-chave, uma aba separada
pra quem já comprou, um filtro de mês, um botão de cadastro renomeado, e
mais cor no board. Isso não substitui nada do que já existe — o kanban
continua exatamente como está, só passa a viver dentro de uma aba.

O site já existe e está em produção: Next.js 15 + Supabase, admin em
`site/src/app/admin/(dashboard)/leads`.

## Estado atual (antes deste spec)

- `/admin/leads/page.tsx` busca `getAllLeadsAdmin` + `getVehicleOptionsAdmin`
  e renderiza só `<LeadKanbanBoard leads vehicles />` (ou o estado vazio).
- `LeadKanbanBoard` já tem: 6 colunas por `lead_stage`, drag-and-drop +
  menu "..." por card, atualização otimista de estágio
  (`useOptimistic`), fluxo de venda (`VehicleSaleForm` + gate de
  `requiresSaleCompletion`).
- `src/lib/lead-kanban.ts` já tem `LEAD_STAGES`, `LEAD_STAGE_LABELS`,
  `groupLeadsByStage`, `requiresSaleCompletion`, `buildWhatsAppLink`,
  `formatIsoDate`.
- `Vehicle` (tipo em `src/lib/types.ts`) já tem `sold_at: string | null`,
  `sale_price_cents: number | null`, `buyer_lead_id: string | null` — dados
  de venda já existem, vêm do sub-projeto 1 (Estoque).
- `getAllVehiclesAdmin(client)` já existe em `src/lib/queries/vehicles.ts`
  e retorna todos os veículos do admin (usado hoje pela grade de Estoque).
- `AdminSidebar.tsx` tem um botão "+ Novo lead" (linha ~56) que abre
  `LeadQuickAddModal`.
- Padrões visuais já estabelecidos e reaproveitados aqui: `StockStatsRow.tsx`
  (card de estatística = chip de ícone colorido + número em Anton
  `text-3xl`) e `VehicleStockGrid.tsx` (abas em formato pílula,
  `rounded-full border`, ativa = `border-graphite bg-graphite text-white`).

## Objetivo deste spec

1. Acima do board, 4 cards de resumo: Clientes ativos, Em negociação,
   Retornos atrasados, Vendas no mês.
2. A página ganha duas abas: **Funil** (o kanban, inalterado) e
   **Compradores** (lista de vendas).
3. Um filtro de mês (padrão: mês atual) que afeta só o card "Vendas no
   mês" e a aba Compradores — os outros 3 cards e o Funil sempre refletem
   o estado atual, não um mês passado (não há histórico de mudança de
   estágio para reconstruir "quem estava ativo em maio").
4. O botão "+ Novo lead" vira "Novo cliente" em todo lugar (sidebar e
   aqui) — mesmo modal, só o texto muda.
5. O kanban ganha uma cor de destaque por coluna (cabeçalho + borda fina
   no card), reaproveitando só cores já usadas no projeto.

## Fora de escopo (explicitamente)

- Histórico de mudança de estágio (quando um lead entrou em cada coluna)
  — não existe hoje, e nenhuma das definições deste spec depende disso.
- Edição do valor/definição das métricas pelo usuário (thresholds fixos
  no código, como já é o padrão do projeto — ex. `stock_turnover_threshold_days`
  é a exceção editável, essas 4 métricas não pediram esse tratamento).
- Gráficos/tendência mês a mês — só o número do mês selecionado.
- Filtro de mês afetando o Funil — decidido explicitamente que não.

## Definições das métricas

Toda a lógica de contagem é pura e testável, em `src/lib/lead-summary.ts`
(mesmo padrão de `lead-kanban.ts`/`vehicle-stock.ts`) — nenhum componente
calcula essas regras diretamente.

- **Clientes ativos**: leads com `stage` diferente de `vendeu` e
  `nao_comprou`. Sempre "agora", não filtra por mês.
- **Em negociação**: leads com `stage === 'negociando'`. Sempre "agora".
- **Retornos atrasados**: leads com `stage === 'visita_marcada'` cuja
  `scheduled_visit_date` + `scheduled_visit_time` (hora ausente = trata
  como `23:59`, fim do dia) já passou do momento atual. Sempre "agora".
  Datas são construídas via `new Date(year, month-1, day, hour, minute)`
  (construtor de hora local, nunca `new Date(isoString)`) — mesmo cuidado
  de fuso horário já usado em `formatIsoDate`/`VehicleDatePicker`.
- **Vendas no mês**: quantidade de veículos com `sold_at` dentro do mês
  selecionado (comparação por prefixo de string `YYYY-MM`, já que
  `sold_at` é um `date` do Postgres retornado como string — sem parsing
  de `Date`, sem risco de fuso horário). **Único card afetado pelo
  filtro de mês.**
- **Compradores (aba)**: leads com `stage === 'vendeu'` cujo `vehicle_id`
  aponta pra um veículo com `sold_at` dentro do mês selecionado. Um lead
  `vendeu` sem `vehicle_id` (não deveria acontecer, dado o gate já
  existente em `updateLead`, mas é logicamente possível via dado legado)
  simplesmente não aparece nessa lista — não há venda pra mostrar.

## Componentes

- **`LeadsOverview.tsx`** (novo, client component) — o novo topo da
  página. Recebe `leads: Lead[]` e `vehicles: Vehicle[]` via props
  (buscados uma vez em `page.tsx`, sem refetch por mês/aba — filtragem é
  toda client-side, mesmo padrão de `VehicleStockGrid`). Estado local:
  `month` (string `YYYY-MM`, default = mês atual via nova
  `getCurrentMonthValue()`) e `activeTab: 'funil' | 'compradores'`
  (default `'funil'`). Renderiza, nessa ordem: `LeadSummaryCards`, a
  barra de abas (mesmo padrão pílula de `VehicleStockGrid`) + o seletor
  de mês (`<input type="month">` nativo, sem componente customizado —
  não há necessidade de um calendário dedicado só pra mês/ano) lado a
  lado, e por fim `LeadKanbanBoard` (aba Funil) ou `BuyersList` (aba
  Compradores). O botão "Novo cliente" fica no cabeçalho desta página
  (abre `LeadQuickAddModal`, mesmo padrão do botão da sidebar).
- **`LeadSummaryCards.tsx`** (novo) — os 4 cards, visual idêntico ao
  `StockStatsRow` (chip de ícone + número `anton.className text-3xl`).
  Props: `{ activeCount, negotiatingCount, overdueCount, soldCount }`
  (números já calculados, o componente só exibe). Ícones: reaproveita
  `LeadsIcon` (Em negociação) e `ClockIcon` (Retornos atrasados), já
  existentes em `icons.tsx`; adiciona dois novos ícones no mesmo estilo
  de linha (`IconBase`, `viewBox 0 0 24 24`, `strokeWidth 1.75`):
  `UsersIcon` (Clientes ativos) e `BanknoteIcon` (Vendas no mês).
- **`BuyersList.tsx`** (novo) — lista/tabela dos compradores do mês
  filtrado: nome, telefone, veículo (marca/modelo/versão), valor da
  venda (`formatPriceFromCents`), data da venda (`formatIsoDate`). Props:
  `{ buyers: { lead: Lead; vehicle: Vehicle }[] }` (já filtrado e
  combinado pelo lib function abaixo — o componente só renderiza).
  Estado vazio: "Nenhuma venda neste mês." (mesmo tom das outras
  mensagens de lista vazia no projeto).
- **`LeadKanbanBoard.tsx`** (modificado) — sem mudança de comportamento,
  só visual: cada `LeadKanbanColumn` ganha uma classe de cor de fundo no
  cabeçalho por `stage`, e cada `LeadCard` ganha uma borda esquerda fina
  (`border-l-4`) na mesma cor. Mapeamento (novo `LEAD_STAGE_ACCENTS` em
  `lead-kanban.ts`, ao lado de `LEAD_STAGE_LABELS`):
  - `novo`, `visita_marcada`, `ligar_de_volta` → `support-gray` (neutro,
    cor de apoio já usada em todo o projeto)
  - `negociando` → `yellow-100`/`yellow-800` (mesmo tom de "sem margem"
    no Estoque, sinaliza "precisa de atenção/em andamento")
  - `vendeu` → `green-50`/`green-700` (mesmo tom de "lucro" no Estoque)
  - `nao_comprou` → `aguiar-red` (mesmo tom de "parado"/urgência no
    Estoque)
- **`AdminSidebar.tsx`** (modificado) — texto do botão "+ Novo lead" →
  "Novo cliente" (linha ~56, só o texto, sem mudar comportamento).

## Fluxo de dados

`page.tsx` busca `getAllLeadsAdmin` + `getAllVehiclesAdmin` +
`getVehicleOptionsAdmin` (a última continua alimentando o
`LeadQuickAddModal`/`LeadKanbanBoard` como já faz) e passa tudo pra
`LeadsOverview`. Dentro de `LeadsOverview`, cada card/lista é derivado via
as funções puras de `lead-summary.ts` a partir de `leads`/`vehicles` e do
`month` selecionado — nenhuma nova query ao Supabase por troca de mês ou
aba, tudo client-side sobre os dados já carregados (mesmo padrão de
`VehicleStockGrid`, que filtra/busca client-side sobre a lista completa).

## Testes

Mesmo padrão do resto do projeto — Vitest, sem rede:

- `lead-summary.ts`: testes unitários puros para cada função de contagem
  (`isLeadActive`, `isOverdueReturn` com casos de hora ausente/presente e
  fuso horário, `vehiclesSoldInMonth`, `getBuyers`,
  `getCurrentMonthValue`).
- `LeadSummaryCards.test.tsx`, `BuyersList.test.tsx`: renderização com
  props fixas.
- `LeadsOverview.test.tsx`: troca de aba mostra/esconde o componente
  certo; troca de mês recalcula só "Vendas no mês" e a lista de
  Compradores, sem afetar os outros 3 cards nem o Funil.
- Ajuste no teste de `AdminSidebar` existente (texto do botão).
