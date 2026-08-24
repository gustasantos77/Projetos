const PLUGGY_API_KEY = process.env.PLUGGY_API_KEY
const PLUGGY_BASE_URL = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai'

async function pluggyFetch(endpoint: string, options?: RequestInit) {
  if (!PLUGGY_API_KEY || PLUGGY_API_KEY === 'sua_api_key_aqui') {
    throw new Error('PLUGGY_API_KEY não configurada')
  }

  const res = await fetch(`${PLUGGY_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': PLUGGY_API_KEY!,
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
