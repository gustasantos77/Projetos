# Changelog - 27/08/2026

## Resumo das Alterações

Sessão de desenvolvimento com 4 correções de bugs críticos e 2 novas funcionalidades: sincronização em tempo real com webhooks da Pluggy e prevenção de transações duplicadas.

---

## 1. Correção de Bug: Data Inválida na Sincronização Pluggy

### Problema
Ao sincronizar transações via Pluggy, o erro `Invalid value for argument 'date': Provided Date object is invalid` era lançado. Isso acontecia porque `new Date(tx.date + 'T12:00:00')` falhava quando `tx.date` era `undefined` ou uma string inválida.

### Solução
Criado o módulo `src/lib/sync-transactions.ts` com função `parseTxDate()` que tenta parsear `dateTime`, `date` ou `postDate` com fallback para `new Date()`:

```typescript
function parseTxDate(tx: Record<string, unknown>): Date {
  const rawDate = tx.dateTime ?? tx.date ?? tx.postDate
  if (rawDate != null && rawDate !== '') {
    const parsed = Date.parse(String(rawDate))
    if (!isNaN(parsed)) return new Date(parsed)
  }
  return new Date()
}
```

### Arquivos modificados
- `src/lib/sync-transactions.ts` (novo) — Lógica de sync extraída do route handler
- `src/app/api/sync/route.ts` — Refatorado para usar `syncTransactionsForUser()`

---

## 2. Correção de Bug: 1018 Transações Duplicadas

### Problema
A sincronização estava criando múltiplas cópias da mesma transação. O `upsert` usava `pluggyId` como chave única, mas transações manuais (sem `pluggyId`) e transações sincronizadas (com `pluggyId`) da mesma operação não eram detectadas como duplicatas.

### Solução
Adicionada verificação de duplicatas no `upsertTransaction()` antes de criar:
1. Verifica se já existe transação com o mesmo `pluggyId` → atualiza
2. Verifica se já existe transação com mesma `description + amount + date + type + userId` → vincula o `pluggyId` à existente
3. Caso contrário, cria nova transação

### Resultado
- **1018 transações duplicadas removidas** via script `scripts/dedup-transactions.ts`
- Futuras duplicatas são prevenidas pela lógica de verificação

### Arquivos criados
- `scripts/dedup-transactions.ts` — Script de limpeza de duplicatas
- `scripts/check-balances.ts` — Script de verificação de saldos Pluggy vs DB

---

## 3. Correção de Bug: "Balanço Geral" com Sinais Invertidos

### Problema
O cálculo do `futureNetEffect` em `getDashboardStats()` tinha os sinais invertidos:
- Receita futura SUBTRAÍA do saldo (errado, deveria somar)
- Despesa futura SOMAVA ao saldo (errado, deveria subtrair)

### Exemplo
Saldo atual: R$ 2.000, Salário previsto: R$ 5.000
- **Antes (errado):** R$ 2.000 - R$ 5.000 = R$ -3.000
- **Agora (correto):** R$ 2.000 + R$ 5.000 = R$ 7.000

### Solução
```typescript
// ANTES (ERRADO):
if (t.type === 'INCOME') return sum - Number(t.amount)
if (t.type === 'EXPENSE') return sum + Number(t.amount)

// AGORA (CORRETO):
if (t.type === 'INCOME') return sum + Number(t.amount)
if (t.type === 'EXPENSE') return sum - Number(t.amount)
```

### Arquivo modificado
- `src/lib/finance-service.ts` — Linhas 230-234

---

## 4. Correção de Bug: Saldo do Cartão de Crédito Somado ao Disponível

### Problema
O "Saldo Total" somava o saldo de contas bancárias (R$ 14.43) com o saldo do cartão de crédito (R$ 240.69), resultando em R$ 255.12. Porém, o saldo do cartão de crédito representa o valor **devido**, não disponível.

### Solução
Filtrar apenas contas do tipo BANK (não CREDIT) no cálculo do saldo:
```typescript
// ANTES:
const currentTotalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0)

// AGORA:
const currentTotalBalance = accounts
  .filter(acc => !String(acc.type).toUpperCase().includes('CREDIT'))
  .reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0)
```

### Arquivo modificado
- `src/lib/finance-service.ts` — Linha 220

---

## 5. Nova Funcionalidade: Sincronização em Tempo Real (Webhooks Pluggy)

### Funcionamento
Quando o usuário conecta uma conta bancária, são registrados webhooks na API da Pluggy para receber notificações quando houver novas transações.

### Fluxo
1. Usuário conecta conta → `action: 'add'` na sync route
2. Webhooks registrados: `item/updated` e `transactions/created`
3. Quando há novas transações, a Pluggy envia POST para `/api/webhooks/pluggy`
4. Endpoint recebe notificação e dispara `syncTransactionsByItemId()` em background
5. Dados são atualizados automaticamente no banco de dados

### Fallback: Polling a cada 5 minutos
Caso os webhooks falhem, o Dashboard faz polling silencioso a cada 5 minutos:
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    await fetch('/api/sync', { method: 'POST', body: JSON.stringify({ action: 'sync' }) })
    await fetchData()
  }, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [month, year, fetchData])
```

### Arquivos criados/modificados
- `src/app/api/webhooks/pluggy/route.ts` (novo) — Endpoint receptor de webhooks
- `src/lib/pluggy.ts` — Funções `createWebhook()`, `listWebhooks()`, `deleteWebhook()`
- `src/lib/sync-transactions.ts` (novo) — Funções `syncTransactionsForUser()` e `syncTransactionsByItemId()`
- `src/app/api/sync/route.ts` — Refatorado para usar módulo compartilhado + registro de webhook
- `src/components/Dashboard.tsx` — Auto-sync polling a cada 5 minutos

### API Pluggy utilizada
- `POST /webhooks` — Criar webhook
- Eventos: `item/updated`, `transactions/created`
- Payload inclui: `event`, `itemId`, `transactionIds`

---

## 6. Bug Fix: Build Turbopack

### Problema
O Turbopack não conseguia parsear o tipo complexo:
```typescript
prisma: Awaited<ReturnType<typeof import('./prisma').then(m => m.prisma)>>
```

### Solução
Simplificado para:
```typescript
prisma: PrismaClient
```

### Arquivo modificado
- `src/lib/sync-transactions.ts` — Import e tipo do parâmetro `prisma`

---

## Resumo de Commits

| Commit | Descrição |
|--------|-----------|
| `d9d4db0` | fix: handle invalid dates from Pluggy API in sync route |
| `e4a1ca0` | feat: real-time sync + dedup transactions |
| `8d0af2b` | fix: invert future transaction signs in totalBalance calculation |
| `c02a9c2` | fix: exclude credit card balances from Balanço Geral |
| `17e0731` | fix: simplify PrismaClient type for Turbopack compatibility |

---

## Arquivos Criados Nesta Sessão

| Arquivo | Propósito |
|---------|-----------|
| `src/lib/sync-transactions.ts` | Lógica compartilhada de sincronização de transações |
| `src/app/api/webhooks/pluggy/route.ts` | Endpoint receptor de webhooks da Pluggy |
| `scripts/dedup-transactions.ts` | Script de limpeza de transações duplicadas |
| `scripts/check-balances.ts` | Script de verificação de saldos |

---

## Arquivos Modificados Nesta Sessão

| Arquivo | Alteração |
|---------|-----------|
| `src/app/api/sync/route.ts` | Refatorado para usar sync-transactions + registro de webhook |
| `src/lib/finance-service.ts` | Corrigido cálculo de saldo (sinais + filtro CREDIT) |
| `src/lib/pluggy.ts` | Adicionadas funções de webhook |
| `src/components/Dashboard.tsx` | Adicionado auto-sync polling + useCallback |

---

## Verificação de Saldos

Script `scripts/check-balances.ts` confirma que os saldos do DB batem com a Pluggy:

| Conta | Saldo Pluggy | Saldo DB | Status |
|-------|-------------|----------|--------|
| Nu Pagamentos (BANK) | R$ 14.43 | R$ 14.43 | ✅ |
| gold (CREDIT_CARD) | R$ 240.69 | R$ 240.69 | ✅ |
| **Total** | **R$ 255.12** | **R$ 255.12** | ✅ |

**Nota:** O "Saldo Total" no app mostra apenas R$ 14.43 (conta bancária), pois o saldo do cartão de crédito (R$ 240.69) é valor devido.

---

## Pendências

### Deploy
- Verificar se webhooks estão funcionando na Pluggy após deploy em produção
- Teste end-to-end: conectar nova conta → verificar se transações aparecem automaticamente

### Melhorias Futuras
- Dashboard em tempo real via WebSocket/SSE (atualmente usa polling de 5 min)
- Toggle entre "Saldo Disponível" e "Saldo Líquido" (conta - cartão)
- Histórico de sincronizações com logs
