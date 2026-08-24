# Próximos passos

## Status atual (2026-08-21)

- Servidor rodando em http://localhost:3002
- Conta de teste: `gustavo@lima.com` / `-WQkgywenN5lmEK9M&%v;$S*`
- Chave Pluggy: configurada e testada (API retorna token)
- Categorias: 6 categorias fixas (Alimentação, Transporte, Lazer, Contas fixas, Salário, Outros)
- Categoria obrigatória no formulário de transação

## Teste local imediato

1. Criar `.env.local` na raiz do projeto com:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=verify-full"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="gere-um-segredo-forte-com-openssl-rand-base64-32"
PLUGGY_API_KEY="sua-chave-real-da-pluggy"
PLUGGY_BASE_URL="https://api.pluggy.ai"
```

2. Gerar certificados mTLS (opcional, mas recomendado):

```bash
bash scripts/generate-certs.sh
```

3. Rodar migration do banco:

```bash
npx prisma db push
```

4. Seed do banco (cria usuário admin + categorias):

```bash
npx prisma db seed
```

5. Iniciar o servidor:

```bash
# Sem mTLS:
npm run dev

# Com mTLS:
npm run server:mtls
```

6. Abrir `http://localhost:3002` e testar:
   - Login com admin@test.com / Test1234!
   - Cadastro de novo usuário
   - Criar transação com categoria obrigatória
   - Conexão bancária via Pluggy
   - Sincronização de transações

## Para instalar certificado no celular (mTLS)

1. Copiar `certs/client.p12` e `certs/ca.crt` para o celular
2. Android: Configurações > Segurança > Credenciais > Instalar certificado
3. iOS: Configurações > Geral > VPN e Gerenciamento de Dispositivos
4. Ver `Registros/mtls-setup.md` para instruções detalhadas

## Deploy

1. Criar banco grátis no Neon
2. Usar conexão PostgreSQL com `sslmode=verify-full`
3. Configurar variáveis na Vercel, nunca no código
4. Ativar 2FA em Vercel, Neon, GitHub e Pluggy
5. Rodar `npx prisma db push` no banco Neon
6. Testar login, conexão Pluggy e sincronização antes de usar dados reais

## Segurança — Camadas implementadas

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Transporte | mTLS (CA própria + certificados) | Implementado |
| Proteção de rotas | Middleware (auth check + rate limit) | Implementado |
| Autenticação | NextAuth + bcrypt + JWT | Implementado |
| Validação de input | Zod em todas as APIs | Implementado |
| Security headers | CSP, HSTS, X-Frame, etc. | Implementado |
| Rate limiting | 100/min geral, 20/min auth | Implementado |
| Banco de dados | Prisma (queries parameterizadas) | Implementado |
| Conexão DB | SSL verify-full | Configurado |
