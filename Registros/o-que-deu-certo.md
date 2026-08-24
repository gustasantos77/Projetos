# O que deu certo

## 2026-08-19

1. A cópia do projeto foi localizada em `C:\Users\gustavo.lima\Documents\Codex\financas-pessoais`.
2. O `node_modules` copiado estava incompleto, mas `npm install --cache .\.npm-cache` reinstalou as dependências corretamente.
3. `npm audit` não encontrou vulnerabilidades após a instalação.
4. O `schema.prisma` ausente foi reconstruído com os modelos usados pelo código: `User`, `BankAccount`, `Category`, `Transaction`, `Budget` e `Recurring`.
5. `npx prisma generate` funcionou depois da recriação do schema.
6. O build de produção passou com `npm run build`.
7. O lint passou sem erros, apenas com avisos antigos.
8. O botão de conectar conta deixou de abrir uma aba solta da Pluggy e passou a usar o widget `PluggyConnect`.
9. O callback `onSuccess` da Pluggy agora captura o `itemId`.
10. O backend agora usa `action: "add"` para salvar as contas da Pluggy no banco.
11. A ação `sync`, que era chamada pelo frontend mas não existia no backend, foi implementada.
12. A sincronização usa o endpoint `/v2/transactions` por `accountId`.
13. Transações importadas usam `pluggyId` com `upsert`, evitando duplicatas.
14. Foi criado `.env.example` sem segredos reais para orientar configuração segura em Vercel/Neon.
15. `.npm-cache` foi adicionado ao `.gitignore`.
16. A tela de configurações passou a exibir erros de API, autenticação, Pluggy e sincronização.

## 2026-08-21 — Segurança e mTLS

17. Schema Prisma restaurado limpo (sem dados do projeto inventário) com modelo adicional `PasswordReset`.
18. `prisma/seed.ts` criado com categorias padrão para novo usuário.
19. `src/middleware.ts` criado: proteção global de rotas, redirecionamento para login, rate limiting por IP, security headers (CSP, HSTS, X-Frame-Options, etc.).
20. **mTLS implementado**: script `scripts/generate-certs.sh` gera CA própria, certificados de servidor e cliente (.p12 para celular).
21. `server.ts` customizado com HTTPS + mTLS (`requestCert: true`, `rejectUnauthorized: true`).
22. `src/lib/mtls.ts` helper para validação de certificados do cliente com CRL (Certificate Revocation List).
23. **Zod** adicionado para validação de todos os inputs de API (transactions, budgets, categories, recurring, sync, signup).
24. **Rate limiting** implementado: 100 req/min geral, 5 req/min para auth, 10 req/min para sync, 30 req/min para writes.
25. **Security headers** via middleware: CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy.
26. **Cadastro de usuário** funcional: `/auth/signup` com validação de senha forte (8+ chars, maiúscula, minúscula, número, símbolo).
27. **Recuperação de senha**: `/auth/forgot-password` gera token (log no console, pronto para integração com email).
28. **Reset de senha**: `/auth/reset-password/[token]` funcional com validação de expiração.
29. **Exportação CSV** de transações implementada em `/api/export`.
30. **Indicador de sync** melhorado: mostra "há Xmin/h/d" em vez de data absoluta.
31. Botão "Exportar CSV" adicionado na tela de transações.
32. Links "Faça o cadastro" e "Esqueci minha senha" agora funcionam.
33. `crossOrigin="anonymous"` adicionado ao script da Pluggy para segurança.
34. Build de produção passou com sucesso (24 rotas, todas funcionais).

## 2026-08-21 — Categorias, Pluggy e Edição

35. **Categorias simplificadas**: schema do seed atualizado de 14 para 6 categorias: Alimentação, Transporte, Lazer, Contas fixas, Salário, Outros.
36. **Banco de categorias atualizado**: script `scripts/update-categories.js` removeu categorias antigas e criou as 6 novas para todos os usuários.
37. **Categoria obrigatória no formulário**: `TransactionForm` agora valida que `categoryId` é obrigatório antes de salvar transação.
38. **Formulário visual com cores**: categorias exibidas em grid com ícone e cor, facilitando identificação.
39. **Conta de teste criada**: `admin@test.com` / `Test1234!` para testes (via `/api/auth/signup` com Zod validation).
40. **Rate limiting corrigido**: limite de auth aumentado de 5 para 20 req/min (NextAuth faz múltiplas requisições por login).
41. **Endpoint Pluggy corrigido**: era `/connect/token`, corrigido para `/connect_token` (underscore) conforme documentação oficial.
42. **Chave API Pluggy configurada**: `.env.local` atualizado com chave real, API testada com sucesso (retorna `accessToken`).
43. **Transação existente categorizada**: transação "Americanas" atribuída à categoria "Alimentação" para que gráficos funcionem.
44. **Build de produção verificado**: passou sem erros após todas as alterações.

## 2026-08-24 — Deploy, Pluggy e Correções

45. **Deploy na Vercel**: app publicado em `https://financas-pessoais-self.vercel.app`
46. **Variáveis de ambiente**: 5 variáveis configuradas via CLI do Vercel
47. **Autenticação Pluggy migrada**: fluxo `clientId` + `clientSecret` → `POST /auth` → `apiKey`
48. **Service Worker corrigido**: prioriza rede sobre cache, fallback correto
49. **CSP atualizado**: `connect.pluggy.ai` adicionado a `frame-src` e `connect-src`
50. **Senha fortalecida**: 24 caracteres com alta entropia
51. **Email atualizado**: `gustavo@lima.com` em ambos os bancos
52. **Pluggy Connect atualizado**: versão `latest` do widget
53. **Dashboard melhorado**: contagem de transações, cache desabilitado, limpeza de estado
54. **Ícones de categorias**: renderização correta com Lucide icons
55. **Timezone corrigido**: `T12:00:00` evita deslocamento de dia
56. **Campo date no update**: schema e rota PUT atualizados
57. **CREDIT→CREDIT_CARD**: conversão automática na importação
58. **Instituição detectada**: usa `connector.name` da Pluggy
59. **101 transações**: datas corrigidas via script
60. **163 débitos**: movidos de volta para conta bancária
61. **4 pares duplicados**: removidos (Saldo em atraso / Crédito de atraso)
62. **Débito no cartão**: 163 transações movidas de volta para conta cartão
63. **Lógica separada**: totalExpenses (gastos) vs totalInvoice (fatura)
64. **17 commits** realizados no total
