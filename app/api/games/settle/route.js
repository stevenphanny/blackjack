import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * POST /api/games/settle - settle a game, record result in games table, update chips
 * @param {Request} req - containing JSON body with:
 *   - clientId: string
 *   - bet: integer
 *   - result: 'win' | 'loss' | 'push'
 *   - delta: integer (positive or negative)
 *   - playerTotal: integer
 *   - dealerTotal: integer
 * @returns { chips: integer } - new chip balance
 */
export async function POST(req) {
  try {
    const { clientId, bet, result, delta, playerTotal, dealerTotal } = await req.json()
    const sb = supabaseServer()
    await sb.from('profiles').upsert({ id: clientId }).select()

    // Insert game record
    const { error: insErr } = await sb.from('games').insert({
      user_id: clientId, bet, result, delta,
      player_total: playerTotal, dealer_total: dealerTotal
    })
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })

    // Update chips via RPC to avoid race conditions
    const { data, error } = await sb.rpc('increment_chips', { p_user_id: clientId, p_amount: delta })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ chips: data })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/**
 * GET request to fetch game history for a user
 * @param {*} req - Request with header 'x-client-id'
 * @returns game rows for that user
 */
export async function GET(req) {
  const clientId = req.headers.get('x-client-id')
  if (!clientId) return NextResponse.json({ rows: [] })
  const sb = supabaseServer()

  // Extract games for this user, most recent first
  const { data } = await sb.from('games').select('*').eq('user_id', clientId).order('created_at', { ascending: false })
  return NextResponse.json({ rows: data ?? [] })
}
