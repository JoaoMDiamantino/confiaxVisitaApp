# PRD — Confiax Visita
**Produto:** App de Gestão de Visitas de Vendedores  
**Empresa:** ConFiaX Seguros  
**Data:** 2026-05-01  
**Versão:** 1.0

---

## 1. Visão Geral

Aplicação web responsiva para gestão das visitas dos vendedores/gestores de conta da ConFiaX Seguros às imobiliárias parceiras. O objetivo é registrar, acompanhar e analisar as visitas comerciais, gerando dados e KPIs para o gerente de vendas.

---

## 2. Objetivos

- Registrar visitas via check-in e checkout com foto como evidência
- Calcular automaticamente a duração de cada visita
- Permitir avaliação da visita (nota 1 a 5 + comentário livre)
- Oferecer agendamento prévio de visitas dentro do app
- Gerar KPIs e relatórios exportáveis para o gerente
- Controlar acesso por perfil (vendedor e admin/gerente)

---

## 3. Personas

### Vendedor / Gestor de Conta
- Acessa o app pelo celular em campo
- Agenda visitas, faz check-in, checkout e avalia as visitas
- Visualiza seu próprio histórico de visitas

### Gerente (Admin)
- Acessa o app pelo desktop ou celular
- Gerencia usuários (cadastro, ativação, desativação)
- Visualiza todos os dados e KPIs do time
- Exporta relatórios

---

## 4. Funcionalidades

### 4.1 Autenticação
- Login individual por e-mail e senha para cada vendedor
- Login do gerente com perfil admin
- Controle de sessão via Supabase Auth

### 4.2 Agendamento de Visitas
- Vendedor agenda visitas dentro do app
- Campos: data, horário e seleção de imobiliária
- Imobiliárias são pré-cadastradas diretamente no Supabase (sem tela de cadastro no app na v1)
- Visitas agendadas ficam visíveis na agenda do vendedor

### 4.3 Check-in
- Vendedor seleciona a visita agendada e inicia o check-in
- Upload de foto obrigatório como evidência da visita
- Sistema registra o timestamp do check-in automaticamente

### 4.4 Checkout
- Vendedor finaliza a visita via checkout
- Sistema registra o timestamp e calcula a duração automaticamente
- Sem bloqueio por tempo mínimo — duração fica disponível nos relatórios

### 4.5 Avaliação da Visita
- Nota de 1 a 5 (escala de estrelas)
- Campo de texto livre para registrar principais atividades, assuntos e ganhos da visita
- Avaliação obrigatória para concluir o checkout

### 4.6 Painel do Vendedor
- Lista de visitas agendadas
- Histórico de visitas realizadas com nota e comentários (exibe as 5 mais recentes na página principal)
- Acesso ao histórico completo em `/historico` com filtros de imobiliária e período
- Status da visita: Agendada / Em andamento / Concluída

### 4.7 Painel Admin (Gerente)
- Visão geral de todos os vendedores e visitas
- Gerenciamento de usuários: cadastro, ativação e desativação de vendedores
- Acesso ao histórico completo de visitas com filtros (vendedor, imobiliária, período)
- KPIs (ver seção 5)
- Exportação de relatórios (CSV e PDF)

---

## 5. KPIs e Relatórios

| Indicador | Descrição |
|---|---|
| Visitas por vendedor | Quantidade de visitas realizadas por dia, semana e mês |
| Imobiliárias sem visita | Lista de imobiliárias sem visita há X dias configuráveis |
| Nota média por vendedor | Média das avaliações por vendedor no período |
| Tempo médio de visita | Média de duração das visitas por vendedor e geral |

Relatórios exportáveis em **CSV** e **PDF**.

---

## 6. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (React) |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + Storage) |
| Hospedagem | Vercel |
| Armazenamento de fotos | Supabase Storage |

---

## 7. Modelagem de Dados (Supabase)

### `users`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | PK |
| name | text | Nome do vendedor |
| email | text | E-mail de login |
| role | enum | `vendedor` ou `admin` |
| active | boolean | Ativo/inativo |
| created_at | timestamp | Data de criação |

### `imobiliarias`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | PK |
| name | text | Nome da imobiliária |
| address | text | Endereço |
| contact | text | Contato principal |
| created_at | timestamp | Data de cadastro |

### `visitas`
| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → users |
| imobiliaria_id | uuid | FK → imobiliarias |
| scheduled_at | timestamp | Data/hora agendada |
| checkin_at | timestamp | Timestamp do check-in |
| checkout_at | timestamp | Timestamp do checkout |
| duration_minutes | integer | Calculado automaticamente |
| photo_url | text | URL da foto no Supabase Storage |
| rating | integer | Nota de 1 a 5 |
| notes | text | Comentário livre |
| status | enum | `agendada`, `em_andamento`, `concluida` |
| created_at | timestamp | Data de criação |

---

## 8. Identidade Visual

- **Cor primária:** Azul ConFiaX (`#00AEEF`)
- **Estilo:** Moderno, clean, corporativo leve
- **Logo:** ConFiaX Seguros — presente no header e tela de login
- **Tipografia:** Sans-serif moderna (ex: Inter)

---

## 9. Páginas e Rotas

| Rota | Perfil | Descrição |
|---|---|---|
| `/login` | Todos | Tela de autenticação |
| `/dashboard` | Vendedor | Agenda e visitas do vendedor |
| `/visitas/agendar` | Vendedor | Agendamento de nova visita |
| `/visitas/[id]/checkin` | Vendedor | Tela de check-in com upload de foto |
| `/visitas/[id]/checkout` | Vendedor | Tela de checkout com avaliação |
| `/admin` | Admin | Painel do gerente com KPIs |
| `/admin/usuarios` | Admin | Gestão de usuários |
| `/admin/visitas` | Admin | Histórico completo com filtros |
| `/admin/relatorios` | Admin | Exportação de relatórios |
| `/historico` | Vendedor | Histórico completo de visitas com filtros de imobiliária e data |

---

## 10. Regras de Negócio

- Imobiliárias são cadastradas diretamente no Supabase (sem interface no app na v1)
- Foto é obrigatória para concluir o check-in
- Avaliação (nota + comentário) é obrigatória para concluir o checkout
- Duração da visita é calculada automaticamente sem bloqueios
- Vendedor só visualiza suas próprias visitas
- Admin visualiza dados de todos os vendedores
- Usuários inativos não conseguem fazer login

---

## 11. Fora do Escopo (v1)

- Geolocalização no check-in/checkout
- Notificações / lembretes de visita
- Integração com Google Calendar ou Outlook
- Cadastro de imobiliárias via interface do app
- Modo offline
- Nota média por imobiliária nos KPIs
- Subcritérios de avaliação

---

## 13. Componentes Compartilhados

Componentes React reutilizáveis criados durante o desenvolvimento:

| Componente | Arquivo | Descrição |
|---|---|---|
| `VisitaCard` | `src/components/VisitaCard.tsx` | Card de visita agendada ou em andamento com botão de ação |
| `StarRating` | `src/components/StarRating.tsx` | Avaliação interativa de 1 a 5 estrelas com acessibilidade |
| `LogoutButton` | `src/components/LogoutButton.tsx` | Botão de logout reutilizável |
| `AdminNav` | `src/components/AdminNav.tsx` | `AdminDesktopNav` (nav horizontal desktop) e `AdminBottomNav` (barra fixa mobile com safe-area) |
| `SuccessToast` | `src/components/SuccessToast.tsx` | Toast de feedback positivo com auto-dismiss 4s, parametrizável por query param |
| `HistoricoList` | `src/components/HistoricoList.tsx` | Lista com até 5 visitas concluídas e link para o histórico completo |
| `HistoricoFiltros` | `src/components/HistoricoFiltros.tsx` | Filtros client-side de imobiliária e intervalo de datas com contador de resultados |

---

## 12. Roadmap Futuro (v2+)

- Geolocalização para validar presença física na visita
- Notificações por e-mail ou push antes das visitas agendadas
- Tela de cadastro e gestão de imobiliárias no app
- Mapa de calor geográfico das visitas
- App mobile nativo (React Native)
- Integração com Google Calendar / Outlook
