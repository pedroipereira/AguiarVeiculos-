# Sistema interno Aguiar Veículos — Sub-projeto 1: Estoque (v2)

## Contexto

O usuário quer construir um sistema de gestão interna para a revenda, com 6
áreas: Painel, Estoque, Leads/CRM, Agenda, Metas e Relatórios (tráfego pago).
Emissão de nota fiscal e integração com o RENAVE ficam deliberadamente fora
de escopo — são integrações externas/governamentais que merecem projeto
próprio depois que o core estiver funcionando.

Ordem de construção aprovada: **1. Estoque ← este spec**, 2. Leads/CRM
(funil kanban), 3. Painel (agrega Estoque + Leads + Metas), 4. Agenda,
5. Metas, 6. Relatórios.

Uma primeira versão deste sub-projeto (Estoque) já havia sido projetada e
implementada em 2026-08-31, incluindo um formulário de veículo ajustado
pixel-a-pixel a um mockup aprovado. O usuário pediu para descartar todo esse
trabalho (`git reset --hard` de volta ao ponto anterior — nenhuma migration
havia sido aplicada em produção, sem dados reais em risco) e recomeçar do
zero, agora usando como referência visual um conjunto mais amplo de imagens:
o mesmo mockup de formulário de veículo já aprovado, e capturas de tela de um
produto de referência (revendcar.com.br, demo "Belloni Motors") mostrando
Painel, uma grade de Estoque em cards, um funil de Clientes em kanban e
Relatórios de tráfego pago.

Este spec cobre apenas a grade de Estoque em cards e o formulário de
veículo — reconstruindo o que existia antes, mas com o modelo de dados e o
visual da grade atualizados para bater com as novas referências. O modelo de
custo/margem/FIPE/venda já havia sido validado antes e é mantido sem
mudanças de comportamento.

O site já existe e está em produção: Next.js 15 + Supabase (Postgres + Auth
+ Storage), com um admin funcional em
`site/src/app/admin/(dashboard)/veiculos`. Este sub-projeto expande o que já
existe — não é greenfield.

## Estado atual (antes deste spec)

- Tabela `vehicles` já tem: marca, modelo, versão, categoria (`body_type`),
  ano modelo/fabricação, km, preço, `fuel_type`/`transmission` (já como
  seleção fixa — resolvido num passe anterior), cor, descrição, motor
  (`engine`), tanque (`fuel_tank_liters`), lugares (`seating_capacity`),
  portas (`doors`), potência (`horsepower`), destaque (`is_featured`),
  status (`available`/`sold`), placa (nunca exposta publicamente).
- Tabela `vehicle_images`, tabela `leads` (usada hoje para captação de
  contato — o funil de vendas completo é o sub-projeto 2, mas a tabela e a FK
  já existem e podem ser referenciadas).
- View `vehicles_public` expõe só um subconjunto explícito de colunas — é o
  mecanismo que já protege campos sensíveis (ex.: `plate`) de vazar pro site
  público. Toda leitura pública já filtra `.eq('status', 'available')`.
- Admin: `VehicleTable.tsx` é uma listagem em linha (não em grade/cards), com
  abas Todos/Disponível/Vendido, toggle instantâneo de "marcar como
  vendido"/"marcar como disponível" (sem capturar dado nenhum da venda), e
  `VehicleForm.tsx` sem custo, margem, opcionais ou referência FIPE.
- Busca de dados por placa já existe e está em produção: rota
  `/api/admin/placas` preenche marca/modelo/ano/cor/combustível a partir da
  placa. Nenhum trabalho novo é necessário para a busca em si.

## Objetivo deste sub-projeto

1. Dar ao Estoque: custo de aquisição, gastos por veículo, margem calculada,
   preço mínimo de venda, captura de dados no momento da venda, consulta de
   preço de referência FIPE, opcionais/equipamentos do veículo, data de
   aquisição (para calcular giro) e um terceiro status ("Em preparação").
2. Reconstruir o formulário de cadastro/edição batendo com o mockup já
   aprovado (Formulário de Veículo).
3. Reconstruir a listagem de Estoque como uma grade de cards com foto, dias
   parado, e destaque visual de margem/lucro — batendo com a referência
   visual (produto revendcar.com.br).
4. Sem vazar nenhum dado financeiro (custo, margem, preço mínimo, dados de
   venda) ou a data de aquisição para o site público.

## Fora de escopo (explicitamente)

- Funil de leads em kanban, Painel, Agenda, Metas, relatórios de tráfego —
  outros sub-projetos.
- Emissão de nota fiscal, RENAVE.
- Atribuição de vendedor/usuário à venda (login único hoje).
- Toggle grade/lista e ordenação customizável na grade de Estoque — cortado
  por YAGNI nesta primeira versão; puramente aditivo se for necessário depois.
- Gestão de fotos do veículo (upload, reordenar por drag-and-drop) — já
  existe e funciona, não é tocado por este sub-projeto além de reposicionar
  a seção no formulário (topo, conforme mockup).

## Modelo de dados

Nova migration, aditiva sobre `vehicles`:

- `status`: passa de `'available' | 'sold'` para
  `'available' | 'preparing' | 'sold'`. Toda leitura pública já filtra
  `.eq('status', 'available')`, então `preparing` fica automaticamente
  invisível no site sem nenhuma mudança adicional nas queries públicas.
  Veículo novo continua nascendo como `available` por padrão (comportamento
  atual preservado); o admin muda manualmente para `preparing` quando fizer
  sentido.
- `acquired_at` (date, opcional): data real em que o veículo entrou no
  pátio. Todo cálculo de "dias parado"/giro usa `acquired_at ?? created_at`
  como fallback, para não quebrar veículos já cadastrados sem essa data.
- `acquisition_cost_cents`, `min_sale_price_cents`, `sale_price_cents`,
  `sold_at`, `buyer_lead_id` (FK → `leads.id`, on delete set null) — mesmos
  campos e mesmo comportamento do design anterior.
- `fipe_brand_code`, `fipe_model_code`, `fipe_year_code`, `fipe_value_cents`,
  `fipe_fetched_at` — cache do último valor FIPE consultado, mesmo
  comportamento do design anterior.
- `optionals text[] not null default '{}'` — chaves de um catálogo fixo
  definido no código (ver abaixo), não uma tabela relacional: é um catálogo
  pequeno e fixo, sem necessidade de integridade referencial extra.

Nova tabela `vehicle_expenses` (idêntica ao design anterior):
`id, vehicle_id, category, description, amount_cents, created_at`, com
`category` restrita a `pintura | lavagem_higienizacao | mecanica |
documentacao | funilaria | outros` (obrigando descrição quando `outros`).
Grava por delete-then-reinsert a cada save do veículo, mesmo padrão já usado
para `vehicle_images`.

Nenhuma das colunas/tabelas novas entra em `vehicles_public` nem em nenhuma
view pública — mesma garantia estrutural de hoje (view com whitelist
explícita de colunas + RLS).

### Catálogo de opcionais

Lista fixa (`VEHICLE_OPTIONALS` em `src/lib/vehicle-optionals.ts`), moldada
pelas duas referências de imagem — o mockup aprovado mostra um subconjunto
curado; a lista completa abaixo cobre os itens mais comuns em anúncios de
veículo no Brasil:

Ar condicionado, Ar digital, Direção elétrica, Direção hidráulica, Vidros
elétricos, Travas elétricas, Retrovisores elétricos, Câmera de ré, Sensor de
estacionamento, Sensor de chuva, Central multimídia, Bluetooth, GPS/
Navegador, Banco de couro, Bancos aquecidos, Teto solar, Teto panorâmico,
Rodas de liga leve, Airbag duplo, Airbag lateral, ABS, Controle de tração,
Controle de estabilidade, Piloto automático, Freio a disco nas 4 rodas,
Volante multifuncional, Keyless Entry/Start, Computador de bordo, Start/Stop
automático, Carregador wireless, Apple CarPlay/Android Auto, Kit multimídia
original, 4×4/AWD/Tração integral, Blindagem, GNV instalado.

Renderizados como pills clicáveis (mesmo padrão visual do mockup: vermelho
sólido quando selecionado, contorno cinza quando não). Lista é só de
conteúdo — fácil de editar depois sem migration (é código, não dado).

## Formulário de veículo (`VehicleForm.tsx`)

Reconstruído do zero batendo com o mockup já aprovado ("Formulário de
Veículo"):

1. **Fotos do veículo** (até 15) — no topo, grid de thumbnails com
   drag-and-drop (já existe, só reposicionado).
2. **Placa** (uso interno, nunca aparece no site) + botão "Buscar dados"
   (integração já existente).
3. **Dados do carro**, dividido em dois grupos com título:
   - *Identificação*: Marca, Modelo, Categoria, Versão.
   - *Especificações*: Ano modelo, Ano fabricação, Km / Cor, Câmbio,
     Combustível / Portas, Motor, Potência / Tanque (L), Lugares.
   - *Descrição* (textarea).
4. **Valores** (uso interno — nunca aparece no site):
   - *Preços*: Preço de venda, Preço mínimo.
   - *Custos e margem*: Custo de aquisição, editor de gastos (+ Adicionar
     gasto, mesmo componente `VehicleExpensesEditor` de antes), margem
     estimada (ou realizada, se já vendido) calculada ao vivo.
   - *Referência FIPE*: busca em cascata marca → modelo → ano (mesmo
     componente `VehicleFipeSection` de antes), mostrando último valor e
     data da última consulta.
   - **Data de aquisição** entra aqui, junto dos outros campos internos (não
     aparece no mockup original porque ele não previa giro de estoque, mas é
     dado interno — mesmo tratamento visual dos demais campos desta seção).
5. **Opcionais e destaque**: pills do catálogo acima + toggle "Carro
   premium" (aparece na coleção de destaque no site).
6. **Salvar veículo**.

Trocar o status (Disponível ↔ Em preparação ↔ Vendido) **não** fica dentro
deste formulário — é ação rápida a partir da grade (ver abaixo), mantendo o
formulário focado em dados do veículo. Marcar como vendido abre o mini-form
de captura de venda (`VehicleSaleForm`: preço de venda, data, comprador
opcional) — mesmo comportamento de antes.

## Grade de Estoque (`VehicleTable.tsx` → grade de cards)

Substitui a listagem em linha atual por uma grade de cards (`grid` CSS,
responsiva), cada card com:

- Foto de capa (primeira imagem do veículo).
- Badge de dias parado (`hoje - (acquired_at ?? created_at)`, em dias) —
  cor neutra normalmente, vermelha quando ≥ 90 dias (mesmo limiar da aba
  "Girar").
- Título (marca + modelo + versão), subtítulo (ano · km · cor).
- Preço de tabela (`price_cents`).
- Um dos dois estados, mutuamente exclusivos:
  - **Sem custo/margem definida** (`acquisition_cost_cents` ou
    `min_sale_price_cents` nulo): pill amarelo "Definir margem", que leva
    direto para a seção de Valores no formulário de edição.
  - **Margem definida**: banda verde "Mínimo à vista R$ X" com o desconto
    (`price_cents − min_sale_price_cents`) ao lado, e abaixo "Custo R$ X" /
    "Lucro R$ X" (`calculateEstimatedMarginCents`, ou a margem realizada se
    já vendido).

Acima da grade, abas de filtro com contador (todas mutuamente exclusivas,
clique alterna o filtro ativo):

- **Todos** — todos os veículos, qualquer status.
- **Sem margem** — `acquisition_cost_cents is null or min_sale_price_cents
  is null`, excluindo vendidos.
- **Girar (+90d)** — `status = 'available'` e dias parado ≥ 90.
- **Em preparação** — `status = 'preparing'`.

Mais uma caixa de busca por texto livre (marca, modelo, versão, cor) acima
da grade, filtrando client-side (o volume de veículos não justifica busca
no servidor).

Ações rápidas no card (mantidas do padrão atual, sem exigir abrir o
formulário): mudar status (Disponível/Em preparação, ou "Marcar como
vendido" abrindo o mini-form de venda), marcar/desmarcar destaque, editar,
excluir.

## Testes

Mesma disciplina do design anterior — TDD, sem dependência de rede:

- Unitários: cálculo de margem (`vehicle-costs.ts`, já validado, sem
  mudança), cálculo de dias parado/giro, filtros da grade (função pura que
  recebe a lista de veículos + filtro ativo e devolve a lista filtrada +
  contadores), parsing/formatação de valores.
- Cliente FIPE (`fipe.ts`) e rotas `/api/admin/fipe/*` — mock de
  `global.fetch`, mesmo padrão de `tests/lib/apiplacas.test.ts`.
- Persistência (`saveVehicle`, `markVehicleSold`, `setVehicleStatus`) — mock
  do client Supabase, mesmo padrão de `tests/lib/actions/vehicles.test.ts`.
- Componentes (`VehicleForm`, `VehicleExpensesEditor`, `VehicleFipeSection`,
  `VehicleSaleForm`, a nova grade de Estoque) — Testing Library.
- Regressão: teste explícito garantindo que nenhum dos campos financeiros
  novos, nem `acquired_at`, aparece em `vehicles_public` ou em qualquer
  payload servido ao site público.

## Stack técnica

Sem mudança: Next.js 15 (App Router), React 19, Supabase (Postgres + Auth),
Zod, Tailwind (tokens existentes: `graphite`, `aguiar-red`, `card-gray`,
`support-gray` — nenhuma cor nova), Vitest + Testing Library. Nenhuma
dependência nova.
