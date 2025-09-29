/**
 * Retrieves the client ID from localStorage or generates a new one
 * @returns {string} - A stable unique client ID stored in localStorage
 */
export function getClientId() {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('client_id')
  if (!id) {
    id = crypto.randomUUID()        // stable per browser
    localStorage.setItem('client_id', id)
  }
  return id
}

/**
 * Buys chips for the player
 * @param {Object} param0 - The parameters object
 * @param {string} param0.clientId - The client ID of the player
 * @param {number} param0.amount - The amount of chips to buy
 * @returns {Promise<number>} - The new chip balance after the purchase
 */
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

/**
 * Retrieves the current chip balance for the player
 * @param {string} clientId - The client ID of the player
 * @returns {Promise<number>} - The current chip balance
 */
export async function getChips(clientId) {
  // amount: 0 → just read current chips
  return apiBuyChips({ clientId, amount: 0 })
}