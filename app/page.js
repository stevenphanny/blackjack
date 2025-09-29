'use client'
import { useEffect, useMemo, useState } from 'react'
import { Button } from "@/components/ui/button"
import { getClientId, getChips } from '@/lib/storage'
import { drawCard, calcHandTotal, dealerAutoPlay, resolveResult } from '@/lib/blackjack'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function Home() {
  // Per-browser ID
  const [clientId, setClientId] = useState('')
  // Current chip balance (DB)
  const [chips, setChips] = useState(0)

  // Game state
  const [bet, setBet] = useState(10)
  const [phase, setPhase] = useState('BETTING') // BETTING | PLAYER | DEALER
  const [player, setPlayer] = useState([])      // array of cards
  const [dealer, setDealer] = useState([])      // array of cards
  const [msg, setMsg] = useState('Place a bet and deal to start.')

  // Memoized totals to avoid unnecessary recalculations
  const pTotal = useMemo(() => calcHandTotal(player).total, [player]) // player dependency - only recalculates if player changes
  const dTotal = useMemo(() => calcHandTotal(dealer).total, [dealer]) // dealer dependency - only recalculates if dealer changes


  // Initialise: get client id & load chips
  useEffect(() => {
    const id = getClientId()
    setClientId(id)
    getChips(id).then(setChips).catch(console.error)
  }, [])

  // Refresh chips when external events happen (e.g., navbar buy)
  useEffect(() => {
    const refreshChips = () => {
      if (clientId) getChips(clientId).then(setChips).catch(console.error)
    }
    window.addEventListener('chipsUpdated', refreshChips)
    return () => {
      window.removeEventListener('chipsUpdated', refreshChips)
      window.removeEventListener('focus', refreshChips)
    }
  }, [clientId])

  // ---- Game actions ----

  /**
   * Deals the cards to start a new round
   * @returns {void}
   */
  function deal() {
    if (phase !== 'BETTING') return
    if (bet < 1) return setMsg('Bet must be at least 1.')
    if (bet > chips) return setMsg('Bet exceeds your chip balance.')
    const p = [drawCard(), drawCard()]
    const d = [drawCard()] // dealer shows one card
    setPlayer(p)
    setDealer(d)
    setMsg('Your turn. Hit or Stand?')
    setPhase('PLAYER')
  }

  function hit() {
    if (phase !== 'PLAYER') return
    const next = [...player, drawCard()]
    setPlayer(next)
    const t = calcHandTotal(next).total
    if (t > 21) {
      setMsg('Bust! Dealer wins.')
      finish('loss', next, dealer)
    }
  }

  function stand() {
    if (phase !== 'PLAYER') return
    setPhase('DEALER')
    const finalDealer = dealerAutoPlay(dealer)
    setDealer(finalDealer)
    const result = resolveResult(player, finalDealer)
    setMsg(result === 'win' ? 'You win!' : result === 'loss' ? 'You lose.' : 'Push.')
    finish(result, player, finalDealer)
  }

  async function finish(result, finalPlayer, finalDealer) {
    // compute delta and persist game result + update chips
    const delta = result === 'win' ? bet : result === 'loss' ? -bet : 0
    try {
      const res = await fetch('/api/games/settle', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientId,
          bet,
          result,
          delta,
          playerTotal: calcHandTotal(finalPlayer).total,
          dealerTotal: calcHandTotal(finalDealer).total,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setChips(data.chips)
        // notify other tabs/components (navbar will update too)
        window.dispatchEvent(new CustomEvent('chipsUpdated', { 
          detail: { newBalance: data.chips, clientId } 
        }))
      } else {
        console.error(data.error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPhase('BETTING')
    }
  }

  return (
    /**
     * flex: fill available space
     * min-h-full: ensure at least full height of viewport
     * flex-col: stack children vertically
     * items-center: center children horizontally
     * justify-center: center children vertically
     * gap-6: spacing between children
     */
    <main className="flex min-h-full flex-col items-center justify-center gap-3">
      {/* Title */}
      <h1 className="text-4xl font-bold text-white my-6">Blackjack</h1>
      
      {/* Dealer table */}
      <section className="max-w-xl rounded-2xl border border-neutral-800 p-4">
        <div className="text-sm opacity-80 mb-2">
          Dealer {phase !== 'PLAYER' && `Total: ${dTotal}`}
        </div>
        <div className="flex gap-2 flex-wrap">
          {dealer.map((c, i) => (
            <Card key={`d-${i}`} c={c} hidden={phase === 'PLAYER' && i === 0} />
          ))}
        </div>
      </section>
      
      {/* Player table */}
      <section className="w-50 max-w-xl rounded-2xl p-4">
        <div className="text-sm opacity-80 mb-2">You: {pTotal}</div>
        <div className="flex gap-2 flex-wrap">
          {player.map((c, i) => <Card key={`p-${i}`} c={c} />)}
        </div>
      </section>


      {/* Betting or Actions */}
      {phase === 'BETTING' ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={bet}
            min={1}
            onChange={e => setBet(Math.max(1, Number(e.target.value)))}
            className="w-24 px-2 py-1 rounded border border-neutral-700 bg-neutral-900 text-white"
          />
          <Button onClick={deal}>Deal</Button>
          <div className="flex gap-1">
            {[5,10,25,50,100].map(v => (
              <Button key={v} variant="outline" onClick={() => setBet(Math.min(v, chips))}>{v}</Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button onClick={hit}>Hit</Button>
          <Button variant="outline" onClick={stand}>Stand</Button>
        </div>
      )}

      

      <div className="text-sm opacity-80">{msg}</div>

      {/* Your existing dialog demo */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Show Dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

// Minimal card UI; hide dealer's first card during player's turn
function Card({ c, hidden }) {
  if (hidden) {
    return <div className="w-14 h-20 rounded bg-neutral-700 border border-neutral-600" />
  }
  return (
    <div className="w-14 h-20 rounded bg-white text-neutral-900 border border-neutral-300 flex items-center justify-center font-semibold">
      {c.rank}{c.suit}
    </div>
  )
}
