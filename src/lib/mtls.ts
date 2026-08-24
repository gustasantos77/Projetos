import type { NextRequest } from 'next/server'

export interface ClientCertInfo {
  cn: string
  serialNumber: string
  valid: boolean
  issuer: string
  validFrom: string
  validTo: string
}

export function getClientCert(request: NextRequest): ClientCertInfo | null {
  const cn = request.headers.get('x-client-cert-cn')
  const serial = request.headers.get('x-client-cert-serial')
  const valid = request.headers.get('x-client-cert-valid')

  if (!cn || !serial) return null

  return {
    cn,
    serialNumber: serial,
    valid: valid === 'true',
    issuer: request.headers.get('x-client-cert-issuer') || 'unknown',
    validFrom: request.headers.get('x-client-cert-valid-from') || '',
    validTo: request.headers.get('x-client-cert-valid-to') || '',
  }
}

export async function requireValidClientCert(
  request: NextRequest
): Promise<ClientCertInfo> {
  const cert = getClientCert(request)

  if (!cert) {
    throw new CertificateError('CERTIFICATE_REQUIRED', 'Certificado do cliente obrigatório')
  }

  if (!cert.valid) {
    throw new CertificateError('CERTIFICATE_INVALID', 'Certificado do cliente inválido ou não autorizado')
  }

  const revoked = await isCertificateRevoked(cert.serialNumber)
  if (revoked) {
    throw new CertificateError('CERTIFICATE_REVOKED', 'Certificado do cliente foi revogado')
  }

  return cert
}

export class CertificateError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'CertificateError'
  }
}

const revokedSerials = new Set<string>()

export async function isCertificateRevoked(serialNumber: string): Promise<boolean> {
  return revokedSerials.has(serialNumber.toLowerCase())
}

export async function revokeCertificate(serialNumber: string): Promise<void> {
  revokedSerials.add(serialNumber.toLowerCase())
}

export function isMtlsEnabled(): boolean {
  return process.env.MTLS_ENABLED === 'true'
}
