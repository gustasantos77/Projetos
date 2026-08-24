# Próximos passos

## Status atual (2026-08-24)

- **Deploy**: `https://financas-pessoais-self.vercel.app` (Vercel)
- **Conta**: `gustavo@lima.com` / `-WQkgywenN5lmEK9M&%v;$S*`
- **Pluggy**: clientId/clientSecret configurados, aguardando aprovação para dados reais
- **Banco**: Neon PostgreSQL com 1.033 transações
- **Categorias**: 6 categorias com ícones Lucide

## Contas no sistema

| Conta | Tipo | Instituição | Transações |
|-------|------|-------------|------------|
| Nu Pagamentos S.A. | BANK | Nubank | 563 |
| gold | CREDIT_CARD | Nubank | 463 |

## Aguardando

- **Aprovação Pluggy**: dados reais para cartão de crédito e conta bancária
- Enquanto isso, o app funciona com dados sandbox (limitados)

## Deploy na Vercel

1. Repositório Git já inicializado e commitado
2. Variáveis de ambiente já configuradas no Vercel
3. Para novos deploys: `vercel --yes --prod`

## Configuração local

1. Criar `.env.local`:

```env
DATABASE_URL="postgresql://neondb_owner:npg_guf2BXhOk4rd@ep-autumn-voice-acvulb1g-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="vkCcVl6qe4CSdDwt78zOXQWhkDHmSWRm0kW4JMDn24A="
PLUGGY_CLIENT_ID="f309d8a4-3e8c-44cc-b2eb-365cd392ea74"
PLUGGY_CLIENT_SECRET="jWaM8l8EGc5X_7TMxhD9tsd3XceUtIIkNayDm0jAQFk"
PLUGGY_BASE_URL="https://api.pluggy.ai"
```

2. Instalar dependências: `npm install`
3. Rodar migrations: `npx prisma db push`
4. Iniciar: `npm run dev`

## Segurança — Camadas implementadas

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Transporte | HTTPS (Vercel) + mTLS (local) | Implementado |
| Proteção de rotas | Middleware (auth check + rate limit) | Implementado |
| Autenticação | NextAuth + bcrypt + JWT | Implementado |
| Validação de input | Zod em todas as APIs | Implementado |
| Security headers | CSP, HSTS, X-Frame, etc. | Implementado |
| Rate limiting | 100/min geral, 20/min auth | Implementado |
| Banco de dados | Prisma (queries parameterizadas) | Implementado |
| Conexão DB | SSL require | Configurado |
| API Pluggy | clientId/clientSecret (não chave direta) | Implementado |

## Correções pendentes (dados Pluggy sandbox)

- Fatura do cartão de crédito incompleta (sandbox limitado)
- Algumas transações podem estar分类adas incorretamente
- Valores reais só disponíveis após aprovação Pluggy

## Possíveis melhorias futuras

- [ ] PWA offline com cache inteligente
- [ ] Notificações de gastos
- [ ] Metas de economia
- [ ] Comparativo mês a mês
- [ ] Exportação de relatórios PDF
- [ ] Integração com mais bancos via Open Finance
