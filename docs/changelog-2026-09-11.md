# Changelog - 11/09/2026

## Resumo das Alterações

Sessão de desenvolvimento com 4 funcionalidades novas: saldo de contas bancárias por mês, sistema de despesas pendentes com carry-over, parcelamento de despesas, e marcação de transações como recorrentes.

---

## 1. Saldo de Contas Bancárias por Mês Selecionado

### Problema
Os saldos das contas bancárias (manual e Pluggy) se repetiam em todos os meses. Ao mudar de setembro para outubro, os valores permaneciam iguais.

### Solução
A função `getBankAccounts()` foi modificada para aceitar parâmetros opcionais `month` e `year`. Quando fornecidos, o saldo é calculado apenas com base nas transações daquele período.

### Funcionalidades
- **Saldo dinâmico**: Cada conta bancária mostra o saldo do mês selecionado
- **Filtro de data**: Transações são filtradas por período para cálculo do saldo
- **Compatibilidade**: Chamadas sem month/year mantêm o comportamento anterior

### Arquivos modificados
- `src/lib/finance-service.ts` — Função `getBankAccounts()` agora aceita `month` e `year`

---

## 2. Sistema de Despesas Pendentes (Carry-Over)

### Problema
Despesas recorrentes não pagas em um mês não eram visíveis nos meses seguintes. Não havia conceito de "pendente" ou "atrasado".

### Solução
Criação de um sistema que calcula dinamicamente quais despesas recorrentes não foram pagas no mês selecionado, exibindo-as como "Contas Pendentes" no Dashboard.

### Funcionalidades
- **Cálculo dinâmico**: A cada acesso ao Dashboard, verifica quais despesas recorrentes não têm transação paga no mês
- **Seção "Contas Pendentes"**: Lista todas as despesas não pagas com botão "Pagar"
- **Botão "Pagar"**: Cria uma transação real com status "PAID"
- **Carry-over**: Despesas não pagas aparecem em todos os meses seguintes até serem quitadas
- **Status PAID/PENDING**: Campo `status` adicionado ao modelo Transaction

### Campo `status` no Prisma
```prisma
model Transaction {
  ...
  status String @default("PAID") // PAID ou PENDING
  ...
}
```

### API Criada
- `PUT /api/transactions/[id]/pay` — Marca transação como paga

### Arquivos modificados
- `prisma/schema.prisma` — Campo `status` adicionado ao modelo Transaction
- `src/lib/finance-service.ts` — Função `getUnpaidRecurring()` calcula despesas pendentes
- `src/lib/finance-service.ts` — Função `getDashboardStats()` inclui pendingTransactions
- `src/components/Dashboard.tsx` — Seção "Contas Pendentes" com botão "Pagar"
- `src/app/api/transactions/[id]/pay/route.ts` — API para marcar como pago

---

## 3. Sistema de Parcelamento de Despesas

### Problema
O usuário queria registrar compras parceladas (ex: 12x de R$ 100), mas não existia essa funcionalidade.

### Solução
Criação de um sistema de parcelamento que gera múltiplas transações automaticamente, uma para cada parcela.

### Funcionalidades
- **Campo "Parcelas"**: Ao criar nova despesa, informe a quantidade de parcelas (1-60)
- **Valor por parcela**: O valor informado é o valor de cada parcela (não o total)
- **Total exibido**: Mostra o valor total da compra (ex: "total: R$ 387,00")
- **Descrição automática**: Cada parcela recebe numeração (ex: "Netflix (1/12)")
- **Parcelas pendentes**: Todas as parcelas são criadas com status "PENDING"
- **Grupo de parcelas**: Parcelas são vinculadas por `installmentGroupId`

### Campos adicionados ao Prisma
```prisma
model Transaction {
  ...
  totalInstallments  Int?
  currentInstallment Int?
  installmentGroupId String?
  ...
}
```

### API Criada
- `POST /api/transactions/installments` — Cria transações parceladas

### Arquivos modificados
- `prisma/schema.prisma` — Campos de parcelas adicionados ao Transaction
- `src/lib/finance-service.ts` — Função `createInstallmentTransaction()`
- `src/lib/validations.ts` — Campo `totalInstallments` no schema
- `src/components/TransactionForm.tsx` — Campo de parcelas no formulário
- `src/app/api/transactions/installments/route.ts` — API de parcelas

---

## 4. Marcar Transações como Recorrentes

### Problema
O usuário queria marcar transações existentes como recorrentes, mas não havia essa opção.

### Solução
Adicionado toggle "Transação Recorrente" ao editar transações. Ao ativar, cria automaticamente uma entrada no modelo `Recurring`.

### Funcionalidades
- **Toggle ao editar**: Opção "Transação Recorrente" no formulário de edição
- **Criação automática**: Ao ativar, cria entrada no modelo `Recurring` vinculada à transação
- **Integração com pendentes**: Despesa recorrente aparece na seção "Contas Pendentes"

### Fluxo
1. Edite uma transação
2. Ative o toggle "Transação Recorrente"
3. Salve
4. Entrada é criada automaticamente em `/recurring`
5. Despesa aparece como pendente no Dashboard (se não paga)

### Arquivos modificados
- `src/lib/finance-service.ts` — Função `updateTransaction()` cria Recurring automaticamente
- `src/components/TransactionForm.tsx` — Toggle de recorrência no formulário
- `src/lib/validations.ts` — Campo `isRecurring` no updateTransactionSchema

---

## 5. Correção de Bug: Transações Excluídas Reapareciam

### Problema
Ao excluir uma transação pendente, ela voltava a aparecer no Dashboard.

### Causa
A função `generatePendingRecurring()` recriava transações excluídas, pois verificava se existia uma transação para cada despesa recorrente. Se não existia (foi excluída), criava uma nova.

### Solução
Mudança de abordagem: em vez de criar transações reais no banco, as despesas pendentes são calculadas **dinamicamente** a cada acesso ao Dashboard.

### Lógica Anterior (problemática)
```
1. Buscar despesas recorrentes ativas
2. Para cada uma, verificar se existe transação no mês
3. Se não existe, CRIAR transação pendente no banco
4. Ao excluir, na próxima carga, transação era recriada
```

### Lógica Atual (corrigida)
```
1. Buscar despesas recorrentes ativas
2. Para cada uma, verificar se existe transação PAGA no mês
3. Se não existe, adicionar à lista de pendentes (sem criar no banco)
4. Ao excluir, transação simplesmente some da lista
```

### Arquivos modificados
- `src/lib/finance-service.ts` — `getUnpaidRecurring()` substitui `generatePendingRecurring()`
- `src/components/Dashboard.tsx` — Botão "Pagar" cria transação ao invés de atualizar

---

## 6. Correção de Bug: Data Inválida na API de Transações

### Problema
Ao clicar em "Pagar", a transação não era criada devido a data inválida.

### Causa
A API sempre adicionava `+ 'T12:00:00'` à data. Quando a data já era ISO string (ex: `2026-09-01T00:00:00.000Z`), gerava `2026-09-01T00:00:00.000ZT12:00:00` (inválida).

### Solução
A API agora verifica se a data já contém hora (`T`) e usa diretamente, senão adiciona `T12:00:00`.

```typescript
// ANTES (errado):
date: new Date(validation.data.date + 'T12:00:00')

// AGORA (correto):
const dateStr = validation.data.date
const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00')
```

### Arquivos modificados
- `src/app/api/transactions/route.ts` — Tratamento de data no POST e PUT

---

## Resumo de Arquivos

### Arquivos Criados
| Arquivo | Propósito |
|---------|-----------|
| `src/app/api/transactions/[id]/pay/route.ts` | API para marcar transação como paga |
| `src/app/api/transactions/installments/route.ts` | API para criar transações parceladas |

### Arquivos Modificados
| Arquivo | Alteração |
|---------|-----------|
| `prisma/schema.prisma` | Campos `status`, `totalInstallments`, `currentInstallment`, `installmentGroupId` |
| `src/lib/finance-service.ts` | `getBankAccounts()`, `getUnpaidRecurring()`, `createInstallmentTransaction()`, `updateTransaction()`, `createTransaction()` |
| `src/lib/validations.ts` | Campos `totalInstallments`, `status`, `isRecurring` |
| `src/components/Dashboard.tsx` | Seção "Contas Pendentes", botão "Pagar", interface atualizada |
| `src/components/TransactionForm.tsx` | Campo parcelas, toggle recorrência |
| `src/app/api/transactions/route.ts` | Tratamento de data, suporte a status |

---

## Schema Final do Transaction

```prisma
model Transaction {
  id                 String       @id @default(cuid())
  userId             String
  bankAccountId      String?
  categoryId         String?
  recurringId        String?
  description        String
  amount             Decimal      @db.Decimal(12, 2)
  type               String
  date               DateTime
  isRecurring        Boolean      @default(false)
  status             String       @default("PAID") // PAID ou PENDING
  notes              String?
  pluggyId           String?      @unique
  totalInstallments  Int?
  currentInstallment Int?
  installmentGroupId String?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  user               User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  bankAccount        BankAccount? @relation(fields: [bankAccountId], references: [id], onDelete: SetNull)
  category           Category?    @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  recurring          Recurring?   @relation(fields: [recurringId], references: [id], onDelete: SetNull)

  @@index([userId, date])
  @@index([bankAccountId])
  @@index([categoryId])
  @@index([installmentGroupId])
  @@index([status])
}
```

---

## Pendências

### Melhorias Futuras
- Adicionar filtro por banco na lista de transações
- Adicionar resumo de gastos por banco no dashboard
- Permitir excluir bancos manuais pela interface
- Adicionar mais ícones de categorias
- Notificação de despesas atrasadas
- Relatório de pagamentos pendentes
