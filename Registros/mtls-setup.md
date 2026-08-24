# Configuração mTLS (Mutual TLS)

## O que é mTLS?

mTLS (Mutual Transport Layer Security) é uma extensão do TLS padrão onde **tanto o servidor quanto o cliente se autenticam mutuamente via certificados digitais**. Isso significa que:

1. O servidor apresenta seu certificado ao cliente
2. O cliente apresenta seu certificado ao servidor
3. Ambos validam se o certificado foi emitido por uma CA confiável
4. Só então a conexão é estabelecida

**Benefício**: Mesmo que um hacker intercepte a conexão, sem o certificado do cliente ele não consegue se comunicar com o servidor.

---

## Fluxo de Segurança

```
Celular (PWA)                          Servidor (Next.js)
     |                                        |
     |-------- TLS Handshake --------------->|
     |<------- Server Certificate -----------|
     |-------- Client Certificate ---------->|
     |<------- TLS Established --------------|
     |                                        |
     |  Certificado validado pela CA? ✓       |
     |  Certificado está na CRL? ✗ (não)     |
     |  Conexão autorizada ✓                  |
```

---

## Pré-requisitos

- OpenSSL instalado (venha com Git for Windows ou WSL)
- Node.js 18+

---

## Passo 1: Gerar os Certificados

```bash
bash scripts/generate-certs.sh
```

Isso gera em `certs/`:

| Arquivo | Descrição |
|---------|-----------|
| `ca.crt` | Certificado da CA (instalar no celular) |
| `server.crt` | Certificado do servidor |
| `server.key` | Chave privada do servidor |
| `client.crt` | Certificado do cliente |
| `client.key` | Chave privada do cliente |
| `client.p12` | Pacote para instalar no celular |
| `.env.certs` | Variáveis de ambiente geradas |

---

## Passo 2: Instalar no Celular

### Android

1. Copie `client.p12` e `ca.crt` para o celular (via USB, Google Drive, etc.)
2. Vá em **Configurações > Segurança > Credenciais > Instalar certificado**
3. Primeiro instale `ca.crt` (como "CA de confiança")
4. Depois instale `client.p12` (usando a senha exibida pelo script)

### iOS (iPhone)

1. Copie `client.p12` e `ca.crt` para o iCloud Drive ou envie por email
2. Abra o arquivo `.p12` → instale o perfil do certificado
3. Vá em **Configurações > Geral > VPN e Gerenciamento de Dispositivos**
4. Confie no certificado instalado
5. Para `ca.crt`: envie por email, abra, e instale como "Certificado confiável"

### Observação importante

No iOS, o Safari pode não pedir o certificado automaticamente. Se isso acontecer:
- Use Chrome no celular (ele suporta melhor mTLS)
- Ou acesse via IP direto em vez de túnel

---

## Passo 3: Habilitar mTLS

1. Copie as variáveis de `certs/.env.certs` para o `.env.local`
2. Ou defina manualmente:

```env
MTLS_ENABLED=true
MTLS_CA_CERT_PATH=certs/ca.crt
MTLS_SERVER_CERT_PATH=certs/server.crt
MTLS_SERVER_KEY_PATH=certs/server.key
```

3. Inicie o servidor:

```bash
npm run server:mtls
```

---

## Passo 4: Testar

1. No celular, abra o navegador e acesse o endereço do servidor
2. O navegador deve pedir o certificado do cliente (popup de seleção)
3. Selecione o certificado instalado
4. Acesse normalmente

---

## Revogar um Certificado

Se o celular for perdido ou roubado:

```bash
# Adicionar serial à CRL (Certificate Revocation List)
# O serial está no output do script de geração ou em:
openssl x509 -in certs/client.crt -noout -serial
```

---

## Segurança Adicional

- O certificado da CA (`ca.crt`) também é instalado no celular para validar o servidor
- Cada dispositivo deve ter seu próprio par de certificados (client.crt + client.key)
- A CRL (lista de revogados) é mantida em memória e pode ser persistida em banco
- Para produção, considere usar uma CA externa (Let's Encrypt não suporta client certs, mas AWS Private CA ou Smallstep sim)

---

## Solução de Problemas

| Problema | Solução |
|----------|---------|
| Navegador não pede certificado | Verifique se o certificado está instalado no sistema |
| "ERR_BAD_CLIENT_CERT" | Certificado não está na CA do servidor |
| "SSL handshake failed" | Certificado expirado ou corrompido |
| iOS não mostra popup de certificado | Use Chrome em vez do Safari |
| Erro "not authorized" | O certificado não foi assinado pela CA correta |
