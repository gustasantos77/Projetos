const CLIENT_ID = process.env.PLUGGY_CLIENT_ID
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET
const PLUGGY_BASE_URL = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai'

let cachedApiKey: string | null = null
let apiKeyExpiry: number = 0

async function getApiKey(): Promise<string> {
  if (cachedApiKey && Date.now() < apiKeyExpiry) {
    return cachedApiKey
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET não configurados')
  }

  const res = await fetch(`${PLUGGY_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Pluggy auth error: ${res.status} - ${error}`)
  }

  const data = await res.json()
  cachedApiKey = data.apiKey
  apiKeyExpiry = Date.now() + 90 * 60 * 1000 // 90 min (key expires in 2h)
  return cachedApiKey!
}

async function pluggyFetch(endpoint: string, options?: RequestInit) {
  const apiKey = await getApiKey()

  const res = await fetch(`${PLUGGY_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Pluggy API error: ${res.status} - ${error}`)
  }

  return res.json()
}

export async function createConnectToken() {
  return pluggyFetch('/connect_token', { method: 'POST' })
}

export async function getItem(itemId: string) {
  return pluggyFetch(`/items/${itemId}`)
}

export async function getAccounts(itemId: string) {
  return pluggyFetch(`/accounts?itemId=${itemId}`)
}

export async function getTransactions(accountId: string, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams({ accountId })
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const results = []
  let nextPath: string | null = `/v2/transactions?${params.toString()}`

  while (nextPath) {
    const page = await pluggyFetch(nextPath)
    results.push(...(page.results ?? []))
    nextPath = page.next ? `/v2/transactions${page.next}` : null
  }

  return { results }
}
