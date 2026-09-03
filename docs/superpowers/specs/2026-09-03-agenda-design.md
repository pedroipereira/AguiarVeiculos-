# Sistema interno Aguiar Veículos — Sub-projeto 4: Agenda

## Contexto

Ordem de construção aprovada: 1. Estoque (feito), 2. Leads/CRM (feito),
3. Painel (feito), **4. Agenda ← este spec**, 5. Metas, 6. Relatórios. Este
spec cobre a Agenda — uma tela de calendário que reúne, num só lugar, os
compromissos que já existem espalhados no CRM de Leads (visitas marcadas,
retornos pendentes) mais datas comerciais relevantes pro setor automotivo
(Dia dos Pais, Black Friday etc.), pra ajudar a planejar promoções.

## Estado atual (antes deste spec)

- `AdminSidebar.tsx` já tem o item "Agenda" na navegação, mas sem `href` —
  renderiza como um `<span>` desabilitado com badge "Em breve"
  (`site/src/components/admin/AdminSidebar.tsx:29`). Nenhuma rota
  `/admin/agenda` existe ainda.
- A tabela `leads` já captura `scheduled_visit_date`/`scheduled_visit_time`
  (visita marcada) desde a migration `0006`, editados via
  `VehicleDatePicker` em `LeadQuickAddModal.tsx`. **Não existe** hoje
  nenhum campo de data para o estágio `ligar_de_volta` — é só um estágio,
  sem data associada, então não há como hoje colocar um "retorno pendente"
  num dia específico do calendário. Este spec adiciona esse campo (ver
  Modelo de dados).
- `src/lib/lead-kanban.ts` já expõe `LEAD_STAGES`, `LEAD_STAGE_LABELS`.
  `src/lib/lead-summary.ts` já expõe `getCurrentMonthValue`,
  `formatMonthLabel`, `shiftMonth` (usados pelo stepper `‹ Mês Ano ›` de
  Leads Overview) e a mesma definição de "lead ativo" usada em todo o
  admin (`stage !== 'vendeu' && stage !== 'nao_comprou'`) — este spec
  reaproveita as três funções de mês diretamente, sem duplicar.
- `VehicleDatePicker.tsx` já resolve o problema de calendário nativo
  (`<input type="date">` sem picker no Safari, comportamento inconsistente
  no Chrome/Firefox) com uma grade de mês construída à mão — mas sua lógica
  de grade (`buildMonthGrid`) é privada ao arquivo e não teve testes
  próprios. A Agenda precisa de uma grade de mês parecida, porém maior
  (calendário de página inteira, não um popover) e com marcadores por dia
  — este spec escreve essa lógica de novo como função pura testável em
  `src/lib/agenda.ts`, em vez de reaproveitar a versão privada do
  `VehicleDatePicker`.

## Objetivo deste sub-projeto

1. Nova página `/admin/agenda`: calendário mensal com navegação
   `‹ Mês Ano ›`, mostrando em cada dia marcadores para visitas marcadas,
   retornos pendentes e datas comerciais.
2. Clicar num dia com compromissos abre uma lista desse dia; itens
   ligados a um lead levam para `/admin/leads`. Datas comerciais só
   mostram o rótulo, sem link — a Agenda é somente leitura, toda edição
   continua no Kanban de Leads.
3. Leads no estágio "Ligar de volta" ganham uma data/hora de retorno,
   capturada no mesmo formulário que já captura a visita marcada.
4. Catálogo fixo de datas comerciais relevantes pro varejo automotivo
   brasileiro, recorrente ano a ano (algumas em dia fixo, outras em regra
   como "2º domingo de maio" ou "última sexta de novembro").
5. Ativar o link "Agenda" na sidebar, removendo o badge "Em breve".

## Fora de escopo (explicitamente)

- Metas, Relatórios — outros sub-projetos.
- Compromissos avulsos não ligados a um lead (reunião interna, lembrete
  manual) — decisão explícita do usuário: a Agenda só espelha dados que já
  existem no CRM de Leads, mais as datas comerciais fixas.
- Edição de datas comerciais pelo próprio admin — lista fixa em código;
  ajustes futuros (adicionar/remover uma data) são pedidos diretamente e
  entram como mudança de código, sem tela nem migration — decisão
  explícita do usuário.
- Qualquer edição a partir da tela da Agenda (marcar como feito, remarcar,
  excluir) — a Agenda é só visualização; editar continua em
  `/admin/leads`.
- Notificações/lembretes (push, e-mail, WhatsApp) para compromissos
  próximos — não pedido.
- Calendário de feriados nacionais/estaduais para fins de dia útil — já
  fora de escopo desde o spec do Painel, não revisitado aqui.

## Modelo de dados

Uma migration pequena, aditiva sobre `leads` (mesmo padrão de
`scheduled_visit_date`/`scheduled_visit_time` da migration `0006`):

- `callback_at` (date, opcional), `callback_time` (time, opcional) — data/
  hora combinada para retornar a ligação. Capturados em
  `LeadQuickAddModal.tsx` com o mesmo par `VehicleDatePicker` + `<input
  type="time">` já usado para a visita marcada, mostrado quando o
  estágio selecionado é `ligar_de_volta` (mesmo padrão condicional que já
  existe nesse form).

Nenhuma tabela nova. As datas comerciais não são dado de banco — são um
catálogo fixo em código (ver abaixo), resolvido para o ano corrente em
tempo de execução, sem persistência.

## Lógica de negócio nova (funções puras, sem rede — mesma disciplina dos sub-projetos anteriores)

### `src/lib/commercial-dates.ts` (novo arquivo)

- `type CommercialDateRule` — uma união de três formas: dia fixo
  (`{ type: 'fixed', month, day }`, ex.: Natal 25/12), "enésimo dia da
  semana do mês" (`{ type: 'nth-weekday', month, weekday, occurrence }`,
  ex.: Dia das Mães = 2º domingo de maio, Dia dos Pais = 2º domingo de
  agosto) e "último dia da semana do mês"
  (`{ type: 'last-weekday', month, weekday }`, ex.: Black Friday = última
  sexta de novembro). Cada regra tem um `label`.
- `COMMERCIAL_DATES: CommercialDateRule[]` — catálogo curado agora,
  cobrindo datas com potencial de campanha pro setor automotivo: Dia do
  Consumidor (15/03, fixo), Dia das Mães (2º domingo de maio), Dia dos
  Namorados (12/06, fixo), Dia dos Pais (2º domingo de agosto), Dia do
  Cliente (15/09, fixo), Dia do Motorista (25/07, fixo), Dia Mundial do
  Automóvel (08/11, fixo), Black Friday (última sexta de novembro), Natal
  (25/12, fixo). Lista é só conteúdo — fácil de ajustar depois sem
  migration, mesmo espírito do catálogo de opcionais do veículo.
- `resolveCommercialDatesForYear(year: number): { date: string; label: string }[]`
  — resolve cada regra pra uma data `YYYY-MM-DD` concreta naquele ano
  (calcula o dia da semana certo pra regras `nth-weekday`/
  `last-weekday`).

### `src/lib/agenda.ts` (novo arquivo)

- `type AgendaEventType = 'visita' | 'retorno' | 'comercial'`
- `interface AgendaEvent { type: AgendaEventType; label: string; time?: string; leadId?: string }`
- `getAgendaEventsByDate(leads: Lead[], month: string): Record<string, AgendaEvent[]>`
  (chave = `YYYY-MM-DD`) — três fontes, todas restritas ao mês pedido:
  - `visita`: leads ativos (`stage !== 'vendeu' && stage !== 'nao_comprou'`,
    mesma definição já usada em `lead-summary.ts`) com `scheduled_visit_date`
    no mês; rótulo = nome do lead, `time` = `scheduled_visit_time`.
  - `retorno`: leads **no estágio `ligar_de_volta`** (não apenas "ativo")
    com `callback_at` no mês; rótulo = nome do lead, `time` =
    `callback_time`. Restrito ao estágio exato, não a "qualquer lead
    ativo", porque `callback_at` não é limpo ao sair do estágio — um lead
    que já foi recontatado e avançou para `negociando` não deve continuar
    aparecendo como retorno pendente num mês passado.
  - `comercial`: saída de `resolveCommercialDatesForYear` filtrada pro mês
    pedido.
  Dentro de um mesmo dia, eventos ficam ordenados por `time` (sem horário
  vai por último), e por tipo (visita, retorno, comercial) quando o
  horário empata ou está ausente.
- `buildAgendaMonthGrid(year: number, month: number): (string | null)[][]`
  — grade de semanas (linhas de 7 células, `null` para dias fora do mês),
  cada célula com a data `YYYY-MM-DD`. Função pura equivalente à
  `buildMonthGrid` privada do `VehicleDatePicker`, mas testável.

## Componentes (`src/components/admin/`)

- `AgendaCalendar.tsx` (client) — recebe `eventsByDate` e o `month`
  inicial (`getCurrentMonthValue()` vindo do server component). Cabeçalho
  `‹ Mês Ano ›` reaproveitando `shiftMonth`/`formatMonthLabel` de
  `lead-summary.ts`. Grade de `buildAgendaMonthGrid`, cada dia com até 3
  pontinhos coloridos (azul = visita, laranja = retorno, vermelho =
  comercial) quando há eventos. Clicar num dia com eventos abre um painel
  lateral com a lista daquele dia; itens com `leadId` são um `<Link
  href="/admin/leads">`, itens comerciais são só texto.
- `AdminAgendaPage` (`site/src/app/admin/(dashboard)/agenda/page.tsx`,
  novo) — server component: busca leads (mesma query já usada em
  `/admin/leads`), calcula `getCurrentMonthValue()`, chama
  `getAgendaEventsByDate` pro mês corrente, renderiza `AgendaCalendar`.
  Trocar de mês no cliente refaz `getAgendaEventsByDate` no próprio
  client component (dado já em mãos — leads do mês vizinho já vieram
  numa janela ampla o suficiente, ou o componente pede o mês seguinte via
  os mesmos leads carregados uma vez; ver nota abaixo).

  **Nota de carregamento:** para evitar um novo fetch a cada troca de
  mês, `AdminAgendaPage` busca **todos** os leads ativos (sem filtro de
  data — mesma query simples que Leads Overview já faz) uma única vez, e
  `AgendaCalendar` recalcula `getAgendaEventsByDate` no cliente a cada
  navegação de mês, com os leads já em mãos. Datas comerciais são
  recalculadas do mesmo jeito (função pura, sem rede).
- `AdminSidebar.tsx`: item "Agenda" ganha `href: '/admin/agenda'`,
  removendo o badge "Em breve" (mesmo tratamento que os demais itens já
  ativos).
- `LeadQuickAddModal.tsx`: novo par `VehicleDatePicker`
  (`lead-callback-date`) + `<input type="time" name="callbackTime">`
  (`lead-callback-time`), mostrado condicionalmente quando o estágio
  selecionado é `ligar_de_volta` — mesmo padrão visual/condicional já
  usado por "Data prevista de visita".

## Stack técnica

Sem dependência nova. Next.js 15 (App Router), React 19, Supabase,
Tailwind (tokens de marca existentes — as 3 cores de marcador reaproveitam
tons já usados em `LEAD_STAGE_ACCENTS`/paleta atual, sem cor nova),
Vitest + Testing Library.

## Testes

- Unitários (sem rede) para `commercial-dates.ts`: cada tipo de regra
  (`fixed`, `nth-weekday`, `last-weekday`) resolvido corretamente para
  pelo menos dois anos diferentes (calendário muda de ano a ano para as
  regras baseadas em dia da semana).
- Unitários para `agenda.ts`: `getAgendaEventsByDate` — leads inativos
  excluídos, visita e retorno no mesmo dia para leads diferentes, mês sem
  nenhum evento, ordenação por horário dentro do dia, mês com bordas
  (fevereiro bissexto, mês de 30 vs. 31 dias). `buildAgendaMonthGrid` —
  primeiro dia do mês em cada dia da semana possível (7 casos), mês com 4
  vs. 5 vs. 6 linhas de grade.
- Componente (`AgendaCalendar`) via Testing Library, dados mockados:
  renderiza os marcadores certos por dia, clique num dia com eventos abre
  a lista, clique num dia vazio não abre nada, item com `leadId` é um
  link para `/admin/leads`.
- Regressão: nenhuma informação de lead nem data comercial vaza pra
  nenhuma rota pública — a Agenda vive inteiramente sob `/admin`, mesma
  garantia estrutural das telas anteriores.
