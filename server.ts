import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'node:url'
import next from 'next'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3001', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const CERTS_DIR = path.join(process.cwd(), 'certs')

function loadCert(filePath: string): Buffer {
  const fullPath = path.resolve(CERTS_DIR, filePath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Certificado não encontrado: ${fullPath}`)
  }
  return fs.readFileSync(fullPath)
}

function loadOptionalCert(filePath: string): Buffer | undefined {
  try {
    return loadCert(filePath)
  } catch {
    return undefined
  }
}

const mtlsEnabled = process.env.MTLS_ENABLED === 'true'

let caCert: Buffer | undefined
let serverCert: Buffer | undefined
let serverKey: Buffer | undefined

if (mtlsEnabled) {
  console.log('[mTLS] Carregando certificados...')
  caCert = loadCert(process.env.MTLS_CA_CERT_PATH || 'ca.crt')
  serverCert = loadCert(process.env.MTLS_SERVER_CERT_PATH || 'server.crt')
  serverKey = loadCert(process.env.MTLS_SERVER_KEY_PATH || 'server.key')
  console.log('[mTLS] Certificados carregados com sucesso')
} else {
  console.log('[mTLS] Desabilitado (defina MTLS_ENABLED=true para habilitar)')
}

app.prepare().then(() => {
  const options: https.ServerOptions = {}

  if (mtlsEnabled && caCert && serverCert && serverKey) {
    options.key = serverKey
    options.cert = serverCert
    options.ca = caCert
    options.requestCert = true
    options.rejectUnauthorized = true
  }

  const server = https.createServer(options, (req, res) => {
    if (mtlsEnabled && req.socket instanceof tls.TLSSocket) {
      const peerCert = req.socket.getPeerCertificate()
      if (peerCert && peerCert.subject) {
        req.headers['x-client-cert-cn'] = peerCert.subject.CN || ''
        req.headers['x-client-cert-serial'] = peerCert.serialNumber || ''
        req.headers['x-client-cert-valid'] = req.socket.authorized ? 'true' : 'false'
      }
    }

    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  server.listen(port, hostname, () => {
    const protocol = mtlsEnabled ? 'https' : 'http'
    console.log(`> Pronto em ${protocol}://${hostname}:${port}`)
    if (mtlsEnabled) {
      console.log('> mTLS habilitado - certificado do cliente obrigatório')
    }
  })
})

import tls from 'node:tls'
