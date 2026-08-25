# Changelog - 25/08/2026

## Resumo das Alterações

Sessão de desenvolvimento com duas funcionalidades principais: implementação do tema escuro e correção do saldo total por mês.

---

## 1. Tema Escuro

### O que foi feito
- Implementação de tema escuro permanente em todo o site
- Todos os componentes foram atualizados para usar variáveis CSS (`var(--...)`) em vez de cores hardcoded

### Arquivos modificados

#### `src/app/globals.css`
- Substituídas todas as variáveis CSS do `:root` pelas cores escuras
- Fundo: `#f8fafc` → `#0f172a`
- Cards: `#ffffff` → `#1e293b`
- Texto: `#1e293b` → `#f1f5f9`
- Bordas: `#e2e8f0` → `#334155`
- Mantidas as paletas de azul e verde com tons mais claros para contraste

#### `src/app/layout.tsx`
- Removida a classe `dark` do elemento `<html>` (não necessária com tema fixo)

#### Componentes atualizados (cores `bg-white` → `bg-[var(--card)]`)
- `src/components/FinanceNav.tsx` - navegação
- `src/components/Dashboard.tsx` - dashboard principal
- `src/components/TransactionForm.tsx` - formulário de transações
- `src/components/TransactionList.tsx` - lista de transações
- `src/components/BudgetOverview.tsx` - visão de orçamentos
- `src/components/CreditCardView.tsx` - visão do cartão de crédito
- `src/components/RecurringList.tsx` - lançamentos recorrentes
- `src/components/SettingsPanel.tsx` - configurações

#### Páginas de autenticação atualizadas
- `src/app/auth/signin/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/reset-password/page.tsx`

### Cores utilizadas no tema escuro
| Variável | Valor | Uso |
|----------|-------|-----|
| `--background` | `#0f172a` | Fundo da página |
| `--foreground` | `#f1f5f9` | Texto principal |
| `--card` | `#1e293b` | Fundo dos cards |
| `--card-foreground` | `#f1f5f9` | Texto nos cards |
| `--muted` | `#1e293b` | Fundo de elementos muted |
| `--muted-foreground` | `#94a3b8` | Texto secundário |
| `--border` | `#334155` | Bordas |
| `--primary` | `#3b82f6` | Cor primária (azul) |
| `--ring` | `#60a5fa` | Focus rings |

---

## 2. Saldo Total por Mês

### Problema
O "Saldo Total" no dashboard sempre mostrava o mesmo valor, independente do mês selecionado. Isso acontecia porque o saldo era calculado a partir do campo `balance` da tabela `BankAccount`, que é um valor estático (saldo atual da conta bancária).

### Solução implementada
Modificada a função `getDashboardStats` em `src/lib/finance-service.ts` para calcular o saldo do mês selecionado:

```typescript
// Saldo atual das contas bancárias
const currentTotalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0)

// Buscar transações FUTURAS (após o mês selecionado)
const futureTransactions = await prisma.transaction.findMany({
  where: {
    userId,
    date: { gt: end },
  },
  select: { amount: true, type: true },
})

// Calcular efeito líquido das transações futuras
const futureNetEffect = futureTransactions.reduce((sum, t) => {
  if (t.type === 'INCOME') return sum - Number(t.amount)
  if (t.type === 'EXPENSE') return sum + Number(t.amount)
  return sum
}, 0)

// Saldo no final do mês selecionado
const totalBalance = currentTotalBalance + futureNetEffect
```

### Lógica
- `currentTotalBalance` = saldo real hoje (inclui todas as transações até agora)
- `futureNetEffect` = o que transações após o mês selecionado contribuíram para o saldo
- Subtraindo o efeito futuro, obtém-se o saldo como era no final do mês selecionado

---

## 3. Deploy

### Problema encontrados
1. O repositório foi renomeado de `teste` para `Projetos` no GitHub
2. O Vercel estava apontando para o repositório antigo
3. Necessário fazer push para ambos os branches `master` e `main`

### Solução
- Adicionado remote: `https://github.com/gustasantos77/Projetos.git`
- Push para `master` e `main`
- Deploy via Vercel CLI: `npx vercel --prod`

### Repositório
- **GitHub**: https://github.com/gustasantos77/Projetos
- **Vercel**: https://financas-pessoais-self.vercel.app/

---

## 4. Pendências

### Fatura do Cartão de Crédito
- Usuário reportou que a fatura está aparecendo igual para outros meses
- Possível causa: transações importadas do Pluggy com datas incorretas ou todas no mesmo mês
- **Status**: Pendente de investigação

### Sugestões futuras
- Verificar formato das datas das transações importadas via Pluggy
- Considerar criar uma tabela de snapshots de saldo por data
- Implementar toggle light/dark mode (opcional)
