# Changelog - 10/09/2026

## Resumo das Alterações

Sessão de desenvolvimento com 3 novas funcionalidades: gerenciamento de categorias, vinculação de transações a bancos com cores, e criação manual de contas bancárias sem Pluggy.

---

## 1. Nova Funcionalidade: Gerenciamento de Categorias

### Problema
O usuário não tinha autonomia para criar, editar ou excluir categorias de receitas/despesas. As categorias eram definidas apenas no seed do banco de dados.

### Solução
Criada uma página completa de gerenciamento de categorias com CRUD via UI.

### Funcionalidades
- **Criar categorias** com nome, tipo (despesa/receita), cor e ícone
- **Editar categorias** existentes
- **Excluir categorias** com confirmação
- **3 novas categorias de despesas**: Cartão, Empréstimo e Cheque Especial

### Arquivos criados
- `src/app/categories/page.tsx` — Página de categorias
- `src/components/CategoryManager.tsx` — Componente de CRUD completo

### Arquivos modificados
- `src/lib/categories.ts` — Adicionadas 3 categorias (Cartão, Empréstimo, Cheque Especial)
- `src/lib/category-icons.ts` — Adicionados ícones CreditCard, Landmark, AlertTriangle
- `src/components/FinanceNav.tsx` — Adicionado link "Categorias" no nav
- `prisma/seed.ts` — Atualizado seed com novas categorias
- `scripts/update-categories.js` — Atualizado script com novas categorias

---

## 2. Nova Funcionalidade: Vinculação de Transações a Bancos com Cores

### Problema
O usuário queria identificar de qual banco provenha cada gasto/receita, mas não existia forma visual clara de associar transações a bancos.

### Solução
Sistema de vinculação de transações a bancos com cores identificadoras.

### Funcionalidades
- **Seletor de banco** no formulário de transação com botões coloridos
- **Bancos suportados**: Banco do Brasil (amarelo), Nubank (roxo), Itaú (laranja), Inter (laranja), PicPay (verde)
- **Ícone do banco** substitui a seta de despesa/receita na lista de transações e no dashboard
- **Saldo calculado automaticamente** para bancos manuais (sem Pluggy)
- **Edição de banco** em transações existentes (antes era resetado)

### Cores dos Bancos
| Banco | Cor | Hex |
|-------|-----|-----|
| Banco do Brasil | Amarelo | `#F59E0B` |
| Nubank | Roxo | `#820AD1` |
| Itaú | Laranja | `#EC7000` |
| Inter | Laranja | `#FF7A00` |
| PicPay | Verde | `#22c55e` |

### Arquivos modificados
- `src/components/BankIcon.tsx` — Cores atualizadas, BB mudado de azul para amarelo
- `src/components/TransactionForm.tsx` — Seletor de banco com cores, edição de banco, criação manual
- `src/components/TransactionList.tsx` — Ícone do banco na lista, edição com categoryId/bankAccountId
- `src/components/Dashboard.tsx` — Ícone do banco nas transações recentes
- `src/lib/finance-service.ts` — Balance calculado para bancos manuais, include bankAccount em stats
- `src/lib/validations.ts` — Adicionado bankAccountId no updateTransactionSchema
- `prisma/schema.prisma` — pluggyItemId agora é opcional

---

## 3. Nova Funcionalidade: Criação Manual de Bancos (sem Pluggy)

### Problema
O usuário queria vincular transações a bancos sem precisar conectar via Pluggy. As contas bancárias só podiam ser criadas pela sincronização automática.

### Solução
Possibilidade de criar bancos manuais diretamente no formulário de transação.

### Funcionalidades
- **Botão "+ Adicionar banco"** no formulário de transação
- **Selecionar banco** entre os 5 disponíveis (com cores)
- **Banco criado automaticamente** com o nome da instituição
- **Banco fica salvo** para uso futuro em outras transações
- **Saldo calculado** a partir das transações vinculadas

### API
- Nova action `create-manual` na rota `POST /api/sync`
- Schema `syncActionSchema` atualizado para aceitar `create-manual`

### Arquivos modificados
- `src/app/api/sync/route.ts` — Adicionada action `create-manual`
- `src/lib/validations.ts` — Adicionado `create-manual` no enum de ações
- `src/lib/finance-service.ts` — `createBankAccount` aceita pluggyItemId opcional
- `prisma/schema.prisma` — `pluggyItemId` alterado de `String` para `String?`

---

## 4. Correção de Bug: BankAccountId não salvava na edição

### Problema
Ao editar uma transação e selecionar um banco, o banco não era salvo. O campo `bankAccountId` não era incluído no body da requisição PUT.

### Solução
Adicionado `bankAccountId` ao body da requisição PUT de transações.

```typescript
// ANTES (errado):
const body = isEditing
  ? { id: ..., description: ..., amount: ..., type, date, categoryId: ..., notes: ... }
  : { description: ..., amount: ..., type, date, categoryId: ..., bankAccountId: ..., notes: ... }

// AGORA (correto):
const body = isEditing
  ? { id: ..., description: ..., amount: ..., type, date, categoryId: ..., bankAccountId: ..., notes: ... }
  : { description: ..., amount: ..., type, date, categoryId: ..., bankAccountId: ..., notes: ... }
```

### Arquivo modificado
- `src/components/TransactionForm.tsx` — Linha 130

---

## Resumo de Arquivos

### Arquivos Criados
| Arquivo | Propósito |
|---------|-----------|
| `src/app/categories/page.tsx` | Página de gerenciamento de categorias |
| `src/components/CategoryManager.tsx` | Componente CRUD de categorias |

### Arquivos Modificados
| Arquivo | Alteração |
|---------|-----------|
| `src/components/BankIcon.tsx` | Cores dos bancos (BB=amarelo, +Bradesco, Santander, etc.) |
| `src/components/TransactionForm.tsx` | Seletor de banco com cores, criação manual, edição com bankAccountId |
| `src/components/TransactionList.tsx` | Ícone do banco (32px), edição com categoryId/bankAccountId |
| `src/components/Dashboard.tsx` | Ícone do banco nas transações recentes, include bankAccount |
| `src/components/FinanceNav.tsx` | Link "Categorias" no nav |
| `src/lib/categories.ts` | +3 categorias (Cartão, Empréstimo, Cheque Especial) |
| `src/lib/category-icons.ts` | +3 ícones (CreditCard, Landmark, AlertTriangle) |
| `src/lib/finance-service.ts` | Balance manual, include bankAccount em stats |
| `src/lib/validations.ts` | +bankAccountId no update, +create-manual no sync |
| `prisma/schema.prisma` | pluggyItemId opcional |
| `prisma/seed.ts` | +3 categorias no seed |
| `scripts/update-categories.js` | +3 categorias no script |
| `src/app/api/sync/route.ts` | Action create-manual |

---

## 5. Correção de Bug: Saldo Total com Valor Incorreto

### Problema
O "Saldo Total" no dashboard estava calculando um valor diferente do esperado. O usuário tinha R$ 5.431 em despesas e nenhuma receita, mas o saldo mostrava valores como -R$ 4.700 e -R$ 6.201,79.

### Causa
Duas raízes:
1. **Sinais invertidos no `futureNetEffect`** — Despesas futuras somavam ao saldo e receitas futuras subtraíam (comportamento invertido)
2. **Transações futuras incluídas no saldo** — O saldo somava o saldo de todas as contas (incluindo transações de outros meses) com o efeito de transações futuras,resultando em um valor que não correspondia ao mês visualizado

### Solução
O "Saldo Total" agora calcula **apenas receitas - despesas do mês atual**, sem considerar transações futuras:

```typescript
// ANTES (errado):
const currentTotalBalance = accounts
  .filter(acc => !String(acc.type).toUpperCase().includes('CREDIT'))
  .reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0)
// + futureNetEffect com sinais invertidos

// AGORA (correto):
const currentTotalBalance = monthTransactions
  .filter(t => t.type === 'INCOME')
  .reduce((sum, t) => sum + Number(t.amount), 0)
  - monthTransactions
  .filter(t => t.type === 'EXPENSE')
  .reduce((sum, t) => sum + Number(t.amount), 0)
const totalBalance = currentTotalBalance
```

### Arquivo modificado
- `src/lib/finance-service.ts` — Função `getDashboardStats()`

### Commits
- `a355889` — fix: corrigir sinais invertidos no futureNetEffect do saldo total
- `acf5104` — fix: saldo total agora calcula apenas com transacoes do mes visualizado
- `c820f1f` — fix: saldo total agora mostra apenas receitas - despesas do mes, sem transacoes futuras

---

## Pendências

### Melhorias Futuras
- Adicionar filtro por banco na lista de transações
- Adicionar resumo de gastos por banco no dashboard
- Permitir excluir bancos manuais pela interface
- Adicionar mais ícones de categorias
