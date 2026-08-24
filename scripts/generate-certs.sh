#!/bin/bash
# ============================================================================
# Gerador de Certificados mTLS para Finanças Pessoais
# ============================================================================
# Gera: CA, certificado do servidor, certificado do cliente (.p12)
#
# Pré-requisitos: OpenSSL instalado
# Uso: bash scripts/generate-certs.sh
# ============================================================================

set -euo pipefail

CERTS_DIR="$(pwd)/certs"
DAYS_CA=3650        # CA válida por 10 anos
DAYS_SERVER=365     # Servidor válido por 1 ano
DAYS_CLIENT=365     # Cliente válido por 1 ano
CLIENT_P12_PASSWORD="financas-mtls-$(openssl rand -hex 8)"

echo "================================================"
echo "  Gerador de Certificados mTLS"
echo "  Projeto: Finanças Pessoais"
echo "================================================"
echo ""

# Limpar diretório anterior
rm -rf "$CERTS_DIR"
mkdir -p "$CERTS_DIR"

# ============================================================================
# 1. CA (Certificate Authority) Própria
# ============================================================================
echo "[1/4] Gerando CA (Certificate Authority)..."

openssl genrsa -out "$CERTS_DIR/ca.key" 4096

openssl req -new -x509 -days $DAYS_CA -key "$CERTS_DIR/ca.key" \
  -out "$CERTS_DIR/ca.crt" \
  -subj "/C=BR/ST=SaoPaulo/L=SaoPaulo/O=FinancasPessoais/OU=Security/CN=Financas CA" \
  -addext "basicConstraints=critical,CA:TRUE" \
  -addext "keyUsage=critical,keyCertSign,cRLSign"

echo "  -> CA criada: certs/ca.crt"

# ============================================================================
# 2. Certificado do Servidor
# ============================================================================
echo "[2/4] Gerando certificado do servidor..."

openssl genrsa -out "$CERTS_DIR/server.key" 2048

cat > "$CERTS_DIR/server.cnf" <<EOF
[req]
default_bits = 2048
prompt = no
distinguished_name = dn
req_extensions = v3_req

[dn]
C = BR
ST = SaoPaulo
L = SaoPaulo
O = FinancasPessoais
OU = Server
CN = localhost

[v3_req]
subjectAltName = @alt_names
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

openssl req -new -key "$CERTS_DIR/server.key" \
  -out "$CERTS_DIR/server.csr" \
  -config "$CERTS_DIR/server.cnf"

openssl x509 -req -days $DAYS_SERVER \
  -in "$CERTS_DIR/server.csr" \
  -CA "$CERTS_DIR/ca.crt" \
  -CAkey "$CERTS_DIR/ca.key" \
  -CAcreateserial \
  -out "$CERTS_DIR/server.crt" \
  -extensions v3_req \
  -extfile "$CERTS_DIR/server.cnf"

echo "  -> Certificado do servidor criado: certs/server.crt"

# ============================================================================
# 3. Certificado do Cliente
# ============================================================================
echo "[3/4] Gerando certificado do cliente..."

openssl genrsa -out "$CERTS_DIR/client.key" 2048

cat > "$CERTS_DIR/client.cnf" <<EOF
[req]
default_bits = 2048
prompt = no
distinguished_name = dn
req_extensions = v3_req

[dn]
C = BR
ST = SaoPaulo
L = SaoPaulo
O = FinancasPessoais
OU = Client
CN = usuario-celular

[v3_req]
keyUsage = digitalSignature
extendedKeyUsage = clientAuth
EOF

openssl req -new -key "$CERTS_DIR/client.key" \
  -out "$CERTS_DIR/client.csr" \
  -config "$CERTS_DIR/client.cnf"

openssl x509 -req -days $DAYS_CLIENT \
  -in "$CERTS_DIR/client.csr" \
  -CA "$CERTS_DIR/ca.crt" \
  -CAkey "$CERTS_DIR/ca.key" \
  -CAcreateserial \
  -out "$CERTS_DIR/client.crt" \
  -extensions v3_req \
  -extfile "$CERTS_DIR/client.cnf"

echo "  -> Certificado do cliente criado: certs/client.crt"

# ============================================================================
# 4. Empacotar cliente em .p12 (para instalar no celular)
# ============================================================================
echo "[4/4] Empacotando certificado do cliente em .p12..."

openssl pkcs12 -export \
  -in "$CERTS_DIR/client.crt" \
  -inkey "$CERTS_DIR/client.key" \
  -certfile "$CERTS_DIR/ca.crt" \
  -out "$CERTS_DIR/client.p12" \
  -passout pass:"$CLIENT_P12_PASSWORD"

# Gerar .env para os certificados
cat > "$CERTS_DIR/.env.certs" <<EOF
# Certificados mTLS - Gerados automaticamente
# NÃO COMMIT ESTE ARQUIVO
MTLS_ENABLED=true
MTLS_CA_CERT_PATH=certs/ca.crt
MTLS_SERVER_CERT_PATH=certs/server.crt
MTLS_SERVER_KEY_PATH=certs/server.key
MTLS_CLIENT_CERT_PATH=certs/client.crt
MTLS_CLIENT_KEY_PATH=certs/client.key
MTLS_CLIENT_P12_PASSWORD=$CLIENT_P12_PASSWORD
EOF

# Limpar arquivos temporários
rm -f "$CERTS_DIR"/*.csr "$CERTS_DIR"/*.cnf "$CERTS_DIR"/*.srl

echo ""
echo "================================================"
echo "  Certificados gerados com sucesso!"
echo "================================================"
echo ""
echo "Arquivos em certs/:"
echo "  ca.crt          - Certificado da CA (instale no celular)"
echo "  server.crt      - Certificado do servidor"
echo "  server.key      - Chave privada do servidor"
echo "  client.crt      - Certificado do cliente"
echo "  client.key      - Chave privada do cliente"
echo "  client.p12      - Pacote para instalar no celular"
echo "  .env.certs      - Variáveis de ambiente dos certificados"
echo ""
echo "Senha do .p12: $CLIENT_P12_PASSWORD"
echo ""
echo "Para instalar no celular:"
echo "  1. Copie 'client.p12' e 'ca.crt' para o celular"
echo "  2. Android: Configurações > Segurança > Credenciais > Instalar certificado"
echo "  3. iOS: Configurações > Geral > VPN e Gerenciamento de Dispositivos"
echo ""
echo "IMPORTANTE: Guarde a senha do .p12 em local seguro!"
echo "O .p12 é necessário para autenticação mTLS no celular."
