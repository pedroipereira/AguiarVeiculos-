# Sistema interno Aguiar Veículos — Sub-projeto 3: Painel

## Contexto

Ordem de construção aprovada: 1. Estoque (feito), 2. Leads/CRM (feito),
**3. Painel ← este spec**, 4. Agenda, 5. Metas, 6. Relatórios. Este spec
cobre o Painel — a tela inicial do admin (`/admin`), que agrega dados de
Estoque e Leads/CRM num dashboard único.

## Estado atual (antes deste spec)

- `/admin` (`site/src/app/admin/(dashboard)/page.tsx`) já existe como um
  placeholder simples do sub-projeto 1 (Estoque): título "Painel" com
  `StockTurnoverCard` (giro médio, contagem parado) e `StockAgingList`
  (lista dos 6 carros parados há mais tempo). Este spec expande essa
  página — não é greenfield.
- Sub-projeto 2 (Leads/CRM) já deixou pronto `src/lib/lead-summary.ts`
  (`getLeadSummaryCounts`, `getBuyers`, helpers de mês) e
  `src/lib/lead-kanban.ts` (`LEAD_STAGES`, `LEAD_STAGE_LABELS`,
  `groupLeadsByStage`, `LEAD_STAGE_ACCENTS`).
- Sub-projeto 1 já deixou pronto `src/lib/vehicle-stock.ts` (`daysInStock`,
  filtros de estoque, `parseTurnoverThreshold`) e `src/lib/vehicle-costs.ts`
  (`calculateTotalCostCents`, `calculateEstimatedMarginCents`,
  `calculateRealizedMarginCents`), além de
  `src/lib/queries/vehicle-expenses.ts` (`getVehicleExpenseTotals`, soma
  batched de despesas por veículo — já usada na grade de Estoque).
- `site_settings` (tabela chave/valor) já existe e já tem um form próprio
  em Configurações (`SiteSettingsForm.tsx`/`adminSetSiteSetting`), usada
  hoje para `stock_turnover_threshold_days`.
- Nenhuma biblioteca de gráficos está instalada no projeto.
- Sub-projeto 5 (Metas) **ainda não existe** — não há modelo de dados de
  metas além do que este spec cria (ver abaixo).

## Referência visual

Mockup de um dashboard de referência ("Belloni Motors", mesmo produto já
usado como referência para o kanban de Leads) foi mostrado durante o
brainstorm. Deste mockup, **apenas o formato do gráfico de funil** (forma
afunilada/trapezoidal, não barras horizontais) entra neste sub-projeto.
Os demais elementos visuais do mockup — projeção de ritmo na faixa de
meta ("fecha o mês em ~X"), faixa de alerta amarela para veículos sem
margem com atalho de ação, e "ticket médio" no card de Faturamento —
foram **explicitamente adiados** pelo usuário para uma iteração futura,
não fazem parte deste spec.

## Objetivo deste sub-projeto

Transformar `/admin` num dashboard único que mostra, de cima para baixo:

1. **Progresso da meta do mês.**
2. **Painel de vendas** com seletor de período.
3. **"Sua loja agora"** — snapshot financeiro do estoque atual.
4. **Funil** — distribuição de leads por etapa, em gráfico afunilado.
5. **Giro de estoque + carros parados** — reaproveitando os componentes
   que já existem.
6. **Gráfico de vendas ao longo do tempo.**

## Fora de escopo (explicitamente)

- Sub-projeto 5 (Metas) completo — metas por vendedor, por categoria,
  histórico de metas passadas. Este spec cria **apenas** um número único
  "meta de vendas do mês", suficiente para a barra de progresso pedida.
- Projeção de ritmo ("no ritmo atual, fecha o mês em ~X") na faixa de
  meta — adiado, ver "Referência visual" acima.
- Faixa de alerta de veículos sem margem definida com atalho de ação —
  adiado.
- "Ticket médio" no card de Faturamento — adiado.
- Calendário de feriados para o cálculo de dias úteis — usa seg-sex fixo,
  sem feriados (decisão explícita do usuário).
- Toggle Faturamento/Vendas no gráfico de série temporal — o gráfico
  mostra só número de vendas por período (decisão explícita do usuário).
- Atribuição de vendedor a vendas/metas (login único hoje, mesma
  limitação já registrada no spec de Estoque).
- Exportação/PDF do Painel — não pedido.

## Modelo de dados

Nenhuma tabela nova. Uma migration aditiva, uma linha nova em
`site_settings`:

- `monthly_sales_goal` (texto, parseado como número, mesmo padrão de
  `stock_turnover_threshold_days`): meta de vendas do mês corrente, sem
  valor padrão implícito — se não configurada, a faixa de progresso
  mostra um estado vazio ("Defina sua meta em Configurações") em vez de
  dividir por zero ou assumir um número. Configuração ganha um campo
  numérico simples, mesmo componente/padrão do limiar de giro
  (`SiteSettingsForm.tsx`/`adminSetSiteSetting`).

## Lógica de negócio nova (funções puras, sem rede — mesma disciplina dos
sub-projetos anteriores)

Em `src/lib/dashboard.ts` (novo arquivo):

- `calculateGoalProgress(soldCount: number, goal: number | null, now: Date): GoalProgress`
  → `{ percent: number, remaining: number, businessDaysLeft: number } | null`
  (retorna `null` quando `goal` é `null`, para o estado vazio). Dias úteis
  restantes = dias de segunda a sexta entre `now` (inclusive, se for dia
  útil) e o último dia do mês corrente (inclusive), sem calendário de
  feriados. `percent` arredondado, `remaining = max(0, goal - soldCount)`.
- Tipo `DateRangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'`
  e `resolveDateRange(preset: DateRangePreset, now: Date, custom?: { start: string; end: string }): { start: string; end: string }`
  (strings `YYYY-MM-DD`). "Semana" = semana corrente (segunda a domingo).
  "Personalizado" com `end < start` é tratado como intervalo vazio (nenhum
  veículo casa), não como erro — evita tela quebrada por um input
  temporariamente inválido enquanto o usuário ainda está escolhendo as
  duas datas.
- `getSalesPanelMetrics(vehicles: Vehicle[], expenseTotals: Record<string, number>, range: { start: string; end: string }): { count: number; revenueCents: number; profitCents: number }`
  — filtra veículos com `sold_at` dentro do intervalo (inclusive),
  `revenueCents` = soma de `sale_price_cents`, `profitCents` = soma de
  `calculateRealizedMarginCents(sale_price_cents, totalCostCents)` por
  veículo, onde `totalCostCents = calculateTotalCostCents(acquisition_cost_cents, [{ amount_cents: expenseTotals[vehicle.id] ?? 0 }])`
  — reaproveita as funções puras existentes de `vehicle-costs.ts` sem
  duplicar cálculo de margem, alimentadas pelo total já batched de
  `getVehicleExpenseTotals`.
- `getStoreSnapshot(vehicles: Vehicle[], expenseTotals: Record<string, number>): { investedCents: number; listValueCents: number; expectedProfitCents: number }`
  — sobre veículos com `status` em `available`/`preparing` (independe do
  período escolhido). `investedCents` = soma de custo total (aquisição +
  despesas); `listValueCents` = soma de `price_cents`; `expectedProfitCents`
  = `listValueCents - investedCents`.
- `getFunnelData(leads: Lead[]): { stage: LeadStage; label: string; count: number }[]`
  — usa `LEAD_STAGES`/`LEAD_STAGE_LABELS` já existentes, na ordem do
  funil (`novo` → `visita_marcada` → `negociando` → `ligar_de_volta` →
  `vendeu`; `nao_comprou` fica de fora do funil, é uma saída lateral, não
  uma etapa de progresso).
- `getSalesTimeSeries(vehicles: Vehicle[], granularity: 'day' | 'week' | 'month', buckets: number, now: Date): { bucketLabel: string; count: number }[]`
  — agrupa vendas (`sold_at`) nos últimos N buckets a partir de `now`
  (ex.: `granularity: 'day', buckets: 7` = últimos 7 dias). Buckets sem
  venda aparecem com `count: 0` (não somem do gráfico).

## Componentes (`src/components/admin/`)

- `GoalProgressBanner.tsx` — usa `calculateGoalProgress`; estado vazio
  com link para Configurações quando `goal` é `null`.
- `SalesPanel.tsx` — seletor de período (botões Hoje/Ontem/Semana/Mês/Ano
  + um par de inputs de data para "Personalizado"), 3 números via
  `getSalesPanelMetrics`. Seleção de período é estado local (não
  persiste, mesmo padrão do filtro client-side da grade de Estoque).
- `StoreSnapshotCard.tsx` — 3 números via `getStoreSnapshot`.
- `LeadFunnelChart.tsx` — `Recharts` `FunnelChart`/`Funnel`, dados de
  `getFunnelData`, cores de `LEAD_STAGE_ACCENTS` (adaptando pra
  preenchimento sólido, já que o funil não usa borda como o kanban).
- `SalesTimeSeriesChart.tsx` — `Recharts` `BarChart`, seletor de
  granularidade (ex. 7 dias / 4 semanas / 12 meses), dados de
  `getSalesTimeSeries`.
- `AdminPainelPage` (`page.tsx` existente) — busca veículos (já busca) +
  leads + `monthly_sales_goal` + despesas em lote
  (`getVehicleExpenseTotals` sobre todos os IDs relevantes), monta os
  componentes acima nessa ordem, mantendo `StockTurnoverCard`/
  `StockAgingList` como estão.

## Stack técnica

Adiciona **Recharts** — primeira dependência nova do projeto desde o
início. Resto sem mudança: Next.js 15 (App Router), React 19, Supabase,
Tailwind (tokens de marca existentes — sem cor nova além de reaproveitar
`LEAD_STAGE_ACCENTS`), Vitest + Testing Library.

## Testes

- Unitários (sem rede) para cada função de `dashboard.ts`: casos de
  borda incluem meta `null` (estado vazio), mês com 28/30/31 dias, "hoje"
  caindo num fim de semana, intervalo "Personalizado" invertido, bucket
  de série temporal sem nenhuma venda, funil com todas as etapas zeradas.
- Componentes (`GoalProgressBanner`, `SalesPanel`, `StoreSnapshotCard`,
  `LeadFunnelChart`, `SalesTimeSeriesChart`) via Testing Library, dados
  mockados.
- Regressão: nenhum dos dados agregados do Painel (financeiro, metas)
  aparece em nenhuma rota pública — mesma garantia estrutural já testada
  para o Estoque.
