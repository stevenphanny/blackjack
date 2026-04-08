'use client'
import { useMemo, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { getClientId, getChips } from '@/lib/storage'
import { drawCard, calcHandTotal, dealerAutoPlay, resolveResult } from '@/lib/blackjack'
import { motion } from "motion/react"

export default function Home() {
  // Per-browser ID
  const [clientId, setClientId] = useState('')
  // Current chip balance (DB)
  const [chips, setChips] = useState(0)

  // Game state
  const [bet, setBet] = useState(10)
  const [phase, setPhase] = useState('BETTING') // BETTING | PLAYER | DEALER | FINISHED
  const [player, setPlayer] = useState([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
  const [dealer, setDealer] = useState([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
  const [msg, setMsg] = useState('')
  const [gameResult, setGameResult] = useState(null) // 'win', 'loss', 'push', or null

  // Animation states
  const [newCardIndices, setNewCardIndices] = useState({ player: [], dealer: [] })
  const [revealDealerCard, setRevealDealerCard] = useState(false)

  // Memoized totals
  const pTotal = useMemo(() => {
    if (phase === 'BETTING') return 0
    return calcHandTotal(player).total
  }, [player, phase])

  const dTotal = useMemo(() => {
    if (phase === 'BETTING') return 0
    return calcHandTotal(dealer).total
  }, [dealer, phase])

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

  function newGame() {
    setPhase('BETTING')
    setPlayer([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
    setDealer([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
    setMsg('Place a bet and deal to start')
    setRevealDealerCard(false)
    setNewCardIndices({ player: [], dealer: [] })
    setGameResult(null)
  }

  function deal() {
    if (phase !== 'BETTING') return
    if (!bet || bet < 1) return setMsg('Bet must be at least 1.')
    if (bet > chips) return setMsg('Bet exceeds your chip balance.')

    setRevealDealerCard(false)
    setNewCardIndices({ player: [], dealer: [] })

    const card1 = drawCard()
    const card2 = drawCard()
    const card3 = drawCard()
    const card4 = drawCard()

    const p = [card1, card3]
    const d = [card2, card4]
    setPlayer(p)
    setDealer(d)

    setNewCardIndices({ player: [0, 1], dealer: [0, 1] })
    setMsg('Your move: Hit or Stand?')

    setTimeout(() => {
      setNewCardIndices({ player: [], dealer: [] })
    }, 600)

    setPhase('PLAYER')
  }

  function hit() {
    if (phase !== 'PLAYER') return
    const newCard = drawCard()
    const next = [...player, newCard]
    setPlayer(next)

    const newIndex = next.length - 1
    setNewCardIndices(prev => ({ ...prev, player: [newIndex] }))

    setTimeout(() => {
      setNewCardIndices(prev => ({ ...prev, player: [] }))
    }, 600)

    const t = calcHandTotal(next).total
    if (t > 21) {
      setGameResult('loss')
      setMsg('Bust! Dealer wins (−' + bet + ' chips)')
      finish('loss', next, dealer)
    }
  }

  function stand() {
    if (phase !== 'PLAYER') return
    setPhase('DEALER')

    setRevealDealerCard(true)

    setTimeout(() => {
      const finalDealer = dealerAutoPlay(dealer)
      setDealer(finalDealer)

      if (finalDealer.length > dealer.length) {
        const newIndices = []
        for (let i = dealer.length; i < finalDealer.length; i++) {
          newIndices.push(i)
        }
        setNewCardIndices(prev => ({ ...prev, dealer: newIndices }))

        setTimeout(() => {
          setNewCardIndices(prev => ({ ...prev, dealer: [] }))
        }, 600)
      }

      const result = resolveResult(player, finalDealer)
      setGameResult(result)
      setMsg(result === 'win' ? 'You win! (+' + bet + ' chips)' : result === 'loss' ? 'You lose (−' + bet + ' chips)' : 'Push — bet returned')
      finish(result, player, finalDealer)
    }, 300)
  }

  async function finish(result, finalPlayer, finalDealer) {
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
        window.dispatchEvent(new CustomEvent('chipsUpdated', {
          detail: { newBalance: data.chips, clientId }
        }))
      } else {
        console.error(data.error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPhase('FINISHED')
    }
  }

  async function aiRecommendation() {
    if (phase !== 'PLAYER') {
      setMsg('AI recommendations are only available during your turn.')
      return
    }

    try {
      setMsg('Consulting AI strategist...')

      const response = await fetch('/api/ai/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCards: player,
          dealerUpCard: dealer[0],
          playerTotal: pTotal
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMsg(`<span class="text-base font-semibold text-[#c9a84c]">AI recommends: ${data.action}</span>\n<span class="text-sm opacity-60">${data.explanation}</span>`)
      } else {
        setMsg('AI recommendation unavailable right now.')
        console.error('AI API error:', data.error)
      }
    } catch (error) {
      console.error('AI recommendation error:', error)
      setMsg('AI recommendation service is currently unavailable.')
    }
  }

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-5">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="z-10 flex flex-col items-center justify-center gap-5"
      >
        {/* Title */}
        <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-bold text-white tracking-wide my-4">
          ♠ Blackjack
        </h1>

        {/* DEALER SECTION */}
        <section className="max-w-xl rounded-2xl p-4">
          <p className="font-[family-name:var(--font-playfair)] italic text-white/40 text-sm text-center mb-3">
            Dealer&apos;s Hand
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            {dealer.map((c, i) => (
              <Card
                key={`d-${i}`}
                c={c}
                hidden={phase === 'BETTING' || (phase === 'PLAYER' && i === 1 && !revealDealerCard)}
                isNew={newCardIndices.dealer.includes(i)}
                isRevealing={i === 1 && revealDealerCard && phase === 'DEALER'}
                isPlaceholder={phase === 'BETTING'}
              />
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-semibold">
              {(phase === 'DEALER' || phase === 'FINISHED') ? `Dealer: ${dTotal}` : 'Dealer'}
            </div>
          </div>
        </section>

        {/* PLAYER SECTION */}
        <section className="max-w-xl rounded-2xl p-4">
          <p className="font-[family-name:var(--font-playfair)] italic text-white/40 text-sm text-center mb-3">
            Your Hand
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            {player.map((c, i) => (
              <Card
                key={`p-${i}`}
                c={c}
                hidden={phase === 'BETTING'}
                isNew={newCardIndices.player.includes(i)}
                isPlaceholder={phase === 'BETTING'}
              />
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <PlayerTotalDisplay phase={phase} total={pTotal} result={gameResult} />
          </div>
        </section>

        {/* Message */}
        {msg && (
          <div
            className="max-w-sm text-sm text-white/60 text-center leading-relaxed px-4 whitespace-pre-line font-[family-name:var(--font-inter)] tracking-wide"
            dangerouslySetInnerHTML={{ __html: msg }}
          />
        )}

        {/* Betting or Actions */}
        {phase === 'BETTING' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={bet}
                onChange={e => setBet(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter bet"
                className="w-24 px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white text-sm focus:border-[#c9a84c] focus:outline-none transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <Button onClick={deal}>Deal</Button>
            </div>
            <div className="flex gap-2">
              {[5, 10, 50, 100].map(v => (
                <Button variant="bet_numbers" key={v} onClick={() => setBet(Math.min(v + bet, chips))}>+{v}</Button>
              ))}
            </div>
          </div>
        ) : phase === 'FINISHED' ? (
          <div className="flex gap-2">
            <Button onClick={newGame}>New Game</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="hit_stand" onClick={hit}>Hit</Button>
            <Button variant="circular_hollow" onClick={aiRecommendation}>?</Button>
            <Button variant="hit_stand" onClick={stand}>Stand</Button>
          </div>
        )}
      </motion.div>
    </main>
  )
}

// Playing card with proper corner layout and suit coloring
function Card({ c, hidden, isNew, isRevealing, isPlaceholder }) {
  const animationClass = isNew ? "animate-[fadeIn_0.6s_ease-in-out_forwards]" : ""
  const revealClass = isRevealing ? "animate-[flip_0.5s_ease-in-out]" : ""
  const baseClasses = "relative w-20 h-[112px] rounded-lg border select-none"

  if (hidden || isPlaceholder) {
    return (
      <div className={`${baseClasses} bg-[#1a2744] border-[#2d3d6b] shadow-lg ${animationClass} ${revealClass}`}>
        {/* Classic card back inner border */}
        <div className="absolute inset-[5px] rounded border border-[#2d3d6b]/60" />
      </div>
    )
  }

  const isRed = c.suit === '♥' || c.suit === '♦'
  const suitColor = isRed ? 'text-red-600' : 'text-neutral-900'

  return (
    <div className={`${baseClasses} bg-white border-neutral-200 shadow-md ${suitColor} ${animationClass} ${revealClass}`}>
      {/* Top-left corner */}
      <div className={`absolute top-1.5 left-2 text-xs font-bold leading-tight font-[family-name:var(--font-playfair)]`}>
        <div>{c.rank}</div>
        <div className="text-[10px]">{c.suit}</div>
      </div>
      {/* Center suit */}
      <div className="flex h-full items-center justify-center text-2xl">
        {c.suit}
      </div>
      {/* Bottom-right corner (rotated) */}
      <div className={`absolute bottom-1.5 right-2 text-xs font-bold leading-tight rotate-180 font-[family-name:var(--font-playfair)]`}>
        <div>{c.rank}</div>
        <div className="text-[10px]">{c.suit}</div>
      </div>
    </div>
  )
}

// Player total display with result-based coloring
function PlayerTotalDisplay({ phase, total, result }) {
  let textColor = 'text-white/70'

  if (result) {
    switch (result) {
      case 'win':  textColor = 'text-[#c9a84c]'; break
      case 'loss': textColor = 'text-red-400';    break
      case 'push': textColor = 'text-yellow-400'; break
    }
  }

  return (
    <div className={`px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold transition-all duration-300 ${textColor}`}>
      {phase === 'BETTING' ? 'You' : `You: ${total}`}
    </div>
  )
}
