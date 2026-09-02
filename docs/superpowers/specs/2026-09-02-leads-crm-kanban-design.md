# Sistema interno Aguiar Veículos — Sub-projeto 2: Leads/CRM (funil kanban)

## Contexto

O usuário está construindo um sistema de gestão interna para a revenda, com 6
áreas: Painel, Estoque, Leads/CRM, Agenda, Metas e Relatórios (tráfego pago).
Ordem de construção aprovada: 1. Estoque (concluído), **2. Leads/CRM (funil
kanban) ← este spec**, 3. Painel, 4. Agenda, 5. Metas, 6. Relatórios.

O site já existe e está em produção: Next.js 15 + Supabase (Postgres + Auth
+ Storage), com um admin funcional em `site/src/app/admin/(dashboard)/leads`.
Este sub-projeto expande o que já existe — não é greenfield.

## Estado atual (antes deste spec)

- Tabela `leads` já tem: `type` (`financing` | `trade_in` | `manual`),
  `name`, `phone`, `details` (jsonb), `vehicle_id` (FK opcional →
  `vehicles`), `stage` (`novo` | `visita_marcada` | `negociando` |
  `ligar_de_volta` | `vendeu` | `nao_comprou`), `first_contact_at`,
  `store_visit_at`, `scheduled_visit_date`, `scheduled_visit_time`,
  `created_at`.
- `/admin/leads` é uma tabela simples (`LeadTable.tsx`) sem ação nenhuma —
  só leitura, sem mudar estágio, editar ou excluir.
- `LeadQuickAddModal.tsx` já existe e cria leads manuais (`lead_type:
  'manual'`), reaproveitado tanto pelo botão "+ Novo lead" da sidebar quanto
  pelo botão "Registrar cliente/negociação" da página de veículo (que
  pré-preenche o veículo e o estágio `negociando`). Só cria — não edita.
- Estoque (sub-projeto 1) já tem `markVehicleSold(client, id, input)` —
  aceita `salePriceCents`, `soldAt`, `buyerLeadId` opcional — e o componente
  `VehicleSaleForm.tsx` que captura esses dados num mini-formulário,
  atualmente só usado a partir do `VehicleSummaryPanel`.
- Nenhuma ação de mudar estágio, editar ou excluir lead existe hoje em
  `src/lib/actions/leads.ts` (só tem `createLead`).

## Objetivo deste sub-projeto

1. Substituir a tabela de Leads por um board kanban: uma coluna por
   `lead_stage` (6 colunas fixas, lado a lado, com contador por coluna),
   batendo com a referência visual (produto revendcar.com.br, funil de
   Clientes).
2. Cada card mostra nome, telefone, veículo de interesse, observações e as
   datas já capturadas, com ações: abrir WhatsApp, editar, mover para outro
   estágio, excluir.
3. Mover um card entre colunas funciona tanto por arrastar-e-soltar quanto
   por um menu "mover para" no card (acessibilidade/mobile).
4. Mover um lead com veículo vinculado para "Vendeu" oferece completar a
   venda no mesmo fluxo, reaproveitando o `VehicleSaleForm` do Estoque.

## Fora de escopo (explicitamente)

- Painel, Agenda, Metas, relatórios de tráfego — outros sub-projetos.
- Histórico/auditoria de mudanças de estágio (quem moveu, quando) — não há
  pedido por isso; se vier a ser necessário, é aditivo depois.
- Soft delete / lixeira de leads — exclusão é definitiva.
- Atribuição de vendedor/usuário ao lead (login único hoje).
- Toggle lista/kanban — o board substitui a tabela por completo, não
  coexiste com ela.
- Mensagem pré-preenchida no link do WhatsApp — abre o chat vazio, sem
  texto.
- Ordenação/drag customizável dentro da mesma coluna — só a mudança de
  coluna (estágio) importa; ordem dentro da coluna é por `created_at`.

## Modelo de dados

Nova migration, aditiva sobre `leads`:

- `notes` (text, opcional): observações livres sobre o lead, editável junto
  com o resto do cadastro. Único campo novo — todo o resto (stage, datas,
  vínculo com veículo) já existe desde a migration 0006.

Nenhuma tabela nova. Nenhuma mudança em `vehicles` ou em views públicas —
leads nunca foram expostos ao site público, e isso não muda.

## Componentes

- **`LeadKanbanBoard.tsx`** (novo, client component): recebe a lista de
  leads e a lista de veículos (para o modal de edição/criação) via props do
  server component da página. Renderiza as 6 colunas fixas
  (`novo → visita_marcada → negociando → ligar_de_volta → vendeu →
  nao_comprou`), cada uma com título, contador e a lista de `LeadCard`
  ordenada por `created_at`. Envolve tudo num `DndContext` (`@dnd-kit/core`)
  com `SortableContext`/droppable por coluna. Ao soltar um card numa coluna
  diferente, chama a mesma função de mudança de estágio usada pelo menu
  (ver "Fluxo de interação").
- **`LeadCard.tsx`** (novo): mostra nome, telefone, veículo de interesse
  (busca pelo `vehicle_id` na lista de veículos recebida via prop, mesmo
  padrão do `VehicleOption` já usado no `LeadQuickAddModal`), observações
  (truncadas, sem expandir), e as datas presentes (só renderiza as que têm
  valor). Botões: link `wa.me/<phone-normalizado>` (abre em nova aba),
  "Editar" (abre `LeadQuickAddModal` em modo edição), menu "..." com
  "Mover para" (submenu/select com os outros 5 estágios) e "Excluir"
  (`window.confirm` seguido de `deleteLead`, mesmo padrão de
  `VehicleSummaryPanel`/`TestimonialTable`).
- **`LeadQuickAddModal.tsx`** (modificado): ganha uma prop opcional `lead?:
  Lead` — quando presente, o form abre pré-preenchido (incluindo o novo
  campo Observações) e submete via `updateLead` em vez de `createLead`;
  título muda para "Editar lead". Sem a prop, comportamento idêntico ao
  atual.
- **`VehicleSaleForm.tsx`** (modificado): ganha uma prop opcional
  `defaultBuyerLeadId?: string` que pré-seleciona esse lead no `<select
  name="buyerLeadId">` (`defaultValue`). Sem a prop, comportamento idêntico
  ao atual.
- **`/admin/leads/page.tsx`** (reescrito): troca `LeadTable` por
  `LeadKanbanBoard`, passando `leads` (via `getAllLeadsAdmin`, sem mudança)
  e `vehicles` (via a query de veículos já usada pelo `LeadQuickAddModal`
  hoje na página de veículo — reaproveitada aqui).

`LeadTable.tsx` é removido (nada mais o usa depois desta troca).

## Ações (`src/lib/actions/leads.ts` + `src/app/actions/leads.ts`)

Seguindo o padrão exato já usado por `vehicles.ts`/`app/actions/vehicles.ts`
(cada `lib/actions` função pura testável com client injetado; cada
`app/actions` wrapper de server action com `'use server'` +
`assertAdmin`):

- `updateLeadStage(client, id, stage: LeadStage): Promise<void>` — update
  simples de `stage`.
- `updateLead(client, id, input): Promise<void>` — atualiza `name`, `phone`,
  `vehicle_id`, `stage`, `notes` e as 4 colunas de data; mesmo shape de
  validação de `CreateLeadInput` mais `notes`.
- `deleteLead(client, id): Promise<void>` — delete definitivo.
- Wrappers: `adminUpdateLeadStage`, `adminUpdateLead`, `adminDeleteLead` em
  `src/app/actions/leads.ts`, todos com `assertAdmin` + `router.refresh()`
  no chamador (mesmo padrão de `adminMarkVehicleSold`/`adminDeleteVehicle`).

## Fluxo de interação

- **Mover por drag-and-drop**: soltar o card numa coluna diferente chama
  `adminUpdateLeadStage(lead.id, novaColuna)` imediatamente (otimista: o
  card já aparece na nova coluna, reverte se a call falhar).
- **Mover pelo menu**: mesmo resultado, disparado pelo item "Mover para" do
  menu "...".
- **Caso especial "Vendeu"**: se o destino é `vendeu` **e** o lead tem
  `vehicle_id`, em vez de só mudar o estágio abre um modal com
  `VehicleSaleForm` (pré-selecionado com `defaultBuyerLeadId={lead.id}`).
  Confirmando a venda: chama `markVehicleSold` (já existente, seta
  `buyer_lead_id`, `status: 'sold'`, etc. no veículo) e **depois**
  `adminUpdateLeadStage(lead.id, 'vendeu')`. Cancelando o modal: o lead
  **não muda de estágio** (evita ficar em "Vendeu" com a venda do veículo
  pendente/esquecida). Sem veículo vinculado, mover para "Vendeu" é uma
  mudança de estágio direta, sem modal.
- **Editar**: abre `LeadQuickAddModal` com `lead` preenchido; salvar chama
  `adminUpdateLead`.
- **Excluir**: `window.confirm('Excluir este lead?')` → `adminDeleteLead`.
- **WhatsApp**: `<a href="https://wa.me/55{phone-só-dígitos}" target="_blank">`.

## Testes

Mesmo padrão dos outros `lib/actions`/`lib/queries` do projeto — Vitest,
mockando o client Supabase (`makeClient`-style helper), sem acesso de rede:

- `updateLeadStage`, `updateLead`, `deleteLead`: chamam a tabela/coluna
  certa com os valores certos.
- Nenhuma lógica de cálculo pura nova (diferente do Estoque) — não há
  `src/lib/*.ts` sem dependência para testar isoladamente além das próprias
  actions.
