# O que deu errado

## 2026-08-19

1. A pasta `Registros` original não veio na cópia inicial do projeto.
   - Resolução: uma nova pasta `Registros` foi criada para continuar a documentação.

2. O projeto veio sem `prisma/schema.prisma`.
   - Impacto: o app não ficaria pronto para migração para Neon.
   - Resolução: o schema foi reconstruído a partir dos usos do código.

3. O `node_modules` copiado estava incompleto no Windows.
   - Sintoma: `next`, `eslint` e `tsc` não eram reconhecidos.
   - Resolução: rodar `npm install --cache .\.npm-cache`.

4. O npm não conseguiu usar o cache global em `AppData`.
   - Sintoma: erro `EPERM` ao acessar `C:\Users\gustavo.lima\AppData\Local\npm-cache`.
   - Resolução: usar cache local do projeto.

5. O botão `Conectar Conta Bancária` parecia não responder.
   - Causa provável inicial: o frontend só abria a Pluggy, mas não capturava o `itemId` nem chamava `action: "add"`.
   - Resolução aplicada: usar `PluggyConnect` com `onSuccess` e salvar o `itemId`.

6. A chave `PLUGGY_API_KEY` não está presente na cópia local.
   - Impacto: sem a chave real, o widget da Pluggy não consegue gerar token.
   - Resolução aplicada: erro explícito `PLUGGY_API_KEY não configurada`.

7. O servidor ativo registrou `NEXTAUTH_URL` ausente e `NEXTAUTH_SECRET` ausente.
   - Impacto: sessões podem falhar com `JWT_SESSION_ERROR` e o clique pode parecer sem resposta.
   - Próxima ação: configurar `.env.local` com `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL` e `PLUGGY_API_KEY`.

8. O endereço `http://192.168.22.214:3001/` é local.
   - Impacto: se o computador desligar, o app para.
   - Próxima ação: publicar na Vercel com banco Neon quando o fluxo local estiver validado.

## 2026-08-21 — Categorias, Pluggy e Edição

9. Rate limiting bloqueou login após múltiplas tentativas.
   - Causa: limite de auth era 5 req/min, NextAuth faz várias requisições por login.
   - Resolução: aumentado para 20 req/min em `src/lib/rate-limit.ts`.

10. Endpoint Pluggy incorreto (`/connect/token` em vez de `/connect_token`).
    - Causa: documentação original usava URL errada.
    - Resolução: corrigido em `src/lib/pluggy.ts` para `/connect_token`.

11. Chave API Pluggy era placeholder (`troque-pela-chave-da-pluggy`).
    - Causa: `.env.local` não tinha chave real.
    - Resolução: usuário forneceu chave real, atualizada em `.env.local`.

12. Gráficos mostravam "Sem despesas" mesmo com transações criadas.
    - Causa: transações existentes não tinham `categoryId` atribuído.
    - Resolução: transação "Americanas" categorizada como "Alimentação" via script.

13. Usuário seed (`admin@financas.com`) tinha hash de senha placeholder.
    - Causa: `prisma/seed.ts` usava hash inválido.
    - Resolução: criada conta de teste via API signup (`admin@test.com` / `Test1234!`).

## 2026-08-24 — Deploy e Correções

14. Build falhou no Vercel com erro `PrismaClientInitializationError`.
    - Causa: `prisma generate` não rodava automaticamente no build.
    - Resolução: adicionado `"postinstall": "prisma generate"` no `package.json`.

15. Chave Pluggy `PLUGGY_API_KEY` retornava erro 403.
    - Causa: Pluggy mudou autenticação para fluxo `clientId` + `clientSecret`.
    - Resolução: migrado para `POST /auth` com `clientId`/`clientSecret`.

16. Site não abria no celular (5G).
    - Causa: CSP bloqueava `connect.pluggy.ai` e service worker com cache incorreto.
    - Resolução: CSP atualizado + service worker reescrito.

17. Widget Pluggy Connect carregava infinitamente.
    - Causa: versão antiga do SDK (`v2.8.2`).
    - Resolução: atualizado para `latest`.

18. Transações apareciam com 1 dia a menos.
    - Causa: `new Date("2026-08-24")` criava UTC midnight, Brasil virava dia anterior.
    - Resolução: adicionado `T12:00:00` em todas as conversões de data.

19. Atualização de data não funcionava.
    - Causa: schema `updateTransactionSchema` não incluía campo `date`.
    - Resolução: adicionado `date` ao schema e rota PUT.

20. Cartão de crédito aparecia como conta bancária.
    - Causa: tipo `CREDIT` da Pluggy não era reconhecido (app esperava `CREDIT_CARD`).
    - Resolução: conversão automática `CREDIT` → `CREDIT_CARD` na importação.

21. Compras no débito foram movidas para o cartão de crédito.
    - Causa: lógica incorreta ao mover transações.
    - Resolução: revertido — débito não vai na fatura do cartão.

22. Pares "Saldo em atraso" / "Crédito de atraso" duplicados.
    - Causa: Pluggy retornava ENTRADA e ESTORNO da mesma penalidade.
    - Resolução: 4 pares deletados (manter apenas EXPENSE).

23. Fatura do cartão mostrava R$ 83,57 vs real R$ 719,12.
    - Causa: Pluggy sandbox não entrega transações reais do cartão.
    - Resolução: aguardando aprovação para dados reais.
