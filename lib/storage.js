export function getClientId() {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('client_id')
  if (!id) {
    id = crypto.randomUUID()        // stable per browser
    localStorage.setItem('client_id', id)
  }
  return id
}

export async function apiBuyChips({ clientId, amount }) {
  const res = await fetch('/api/chips/buy', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ clientId, amount }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'buy failed')
  return data.chips // new balance from DB
}

export async function getChips(clientId) {
  // amount: 0 → just read current chips
  return apiBuyChips({ clientId, amount: 0 })
}