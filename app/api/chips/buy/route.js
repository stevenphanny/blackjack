import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req) {
  try {
    const { clientId, amount = 0 } = await req.json()
    if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })
    const sb = supabaseServer()

    // Ensure profile exists (starts at 500 default)
    await sb.from('profiles').upsert({ id: clientId }).select()

    // Call your Postgres function increment_chips(p_user_id, p_amount)
    const { data, error } = await sb.rpc('increment_chips', {
      p_user_id: clientId,
      p_amount: amount,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ chips: data })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}