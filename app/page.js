'use client'
import { useMemo, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { getClientId, getChips } from '@/lib/storage'
import { drawCard, calcHandTotal, dealerAutoPlay, resolveResult } from '@/lib/blackjack'
import { motion, AnimatePresence } from "motion/react"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
}

export default function Home() {
  const [clientId, setClientId] = useState('')
  const [chips, setChips] = useState(0)

  const [bet, setBet] = useState(10)
  const [phase, setPhase] = useState('BETTING') // BETTING | PLAYER | DEALER | FINISHED
  const [player, setPlayer] = useState([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
  const [dealer, setDealer] = useState([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
  const [msg, setMsg] = useState('')
  const [gameResult, setGameResult] = useState(null)
  const [revealDealerCard, setRevealDealerCard] = useState(false)

  const pTotal = useMemo(() => {
    if (phase === 'BETTING') return 0
    return calcHandTotal(player).total
  }, [player, phase])

  const dTotal = useMemo(() => {
    if (phase === 'BETTING') return 0
    return calcHandTotal(dealer).total
  }, [dealer, phase])

  useEffect(() => {
    const id = getClientId()
    setClientId(id)
    getChips(id).then(setChips).catch(console.error)
  }, [])

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

  function newGame() {
    setPhase('BETTING')
    setPlayer([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
    setDealer([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
    setMsg('Place a bet and deal to start')
    setRevealDealerCard(false)
    setGameResult(null)
  }

  function deal() {
    if (phase !== 'BETTING') return
    if (!bet || bet < 1) return setMsg('Bet must be at least 1.')
    if (bet > chips) return setMsg('Bet exceeds your chip balance.')

    setRevealDealerCard(false)

    const card1 = drawCard()
    const card2 = drawCard()
    const card3 = drawCard()
    const card4 = drawCard()

    setPlayer([card1, card3])
    setDealer([card2, card4])
    setMsg('Your move: Hit or Stand?')
    setPhase('PLAYER')
  }

  function hit() {
    if (phase !== 'PLAYER') return
    const newCard = drawCard()
    const next = [...player, newCard]
    setPlayer(next)

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

      const result = resolveResult(player, finalDealer)
      setGameResult(result)
      setMsg(result === 'win' ? 'You win! (+' + bet + ' chips)' : result === 'loss' ? 'You lose (−' + bet + ' chips)' : 'Push — bet returned')
      finish(result, player, finalDealer)
    }, 600)
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
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.13, delayChildren: 0.05 } }
        }}
        className="z-10 flex flex-col items-center justify-center gap-5"
      >
        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="font-[family-name:var(--font-playfair)] text-5xl font-bold text-white tracking-wide my-4"
        >
          ♠ Blackjack
        </motion.h1>

        {/* DEALER SECTION */}
        <motion.section variants={fadeUp} className="max-w-xl rounded-2xl p-4">
          <p className="font-[family-name:var(--font-playfair)] italic text-white/40 text-sm text-center mb-3">
            Dealer&apos;s Hand
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            {dealer.map((c, i) => (
              <Card
                key={`d-${i}`}
                c={c}
                hidden={phase === 'BETTING' || (phase === 'PLAYER' && i === 1 && !revealDealerCard)}
                isPlaceholder={phase === 'BETTING'}
              />
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm font-semibold">
              {(phase === 'DEALER' || phase === 'FINISHED') ? `Dealer: ${dTotal}` : 'Dealer'}
            </div>
          </div>
        </motion.section>

        {/* PLAYER SECTION */}
        <motion.section variants={fadeUp} className="max-w-xl rounded-2xl p-4">
          <p className="font-[family-name:var(--font-playfair)] italic text-white/40 text-sm text-center mb-3">
            Your Hand
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            {player.map((c, i) => (
              <Card
                key={`p-${i}`}
                c={c}
                hidden={phase === 'BETTING'}
                isPlaceholder={phase === 'BETTING'}
              />
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <PlayerTotalDisplay phase={phase} total={pTotal} result={gameResult} />
          </div>
        </motion.section>

        {/* Message */}
        <AnimatePresence mode="wait">
          {msg && (
            <motion.div
              key={msg.slice(0, 40)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="max-w-sm text-sm text-white/60 text-center leading-relaxed px-4 whitespace-pre-line font-[family-name:var(--font-inter)] tracking-wide"
              dangerouslySetInnerHTML={{ __html: msg }}
            />
          )}
        </AnimatePresence>

        {/* Controls */}
        <AnimatePresence mode="wait">
          {phase === 'BETTING' && (
            <motion.div
              key="betting"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col items-center gap-3"
            >
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
            </motion.div>
          )}

          {phase === 'PLAYER' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-2"
            >
              <Button variant="hit_stand" onClick={hit}>Hit</Button>
              <Button variant="circular_hollow" onClick={aiRecommendation}>?</Button>
              <Button variant="hit_stand" onClick={stand}>Stand</Button>
            </motion.div>
          )}

          {phase === 'FINISHED' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="flex gap-2"
            >
              <Button onClick={newGame}>New Game</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  )
}

// Playing card with 3D flip and slide-in on mount
function Card({ c, hidden, isPlaceholder }) {
  const shouldShowBack = hidden || isPlaceholder
  const isRed = c.suit === '♥' || c.suit === '♦'
  const suitColor = isRed ? 'text-red-600' : 'text-neutral-900'

  return (
    <motion.div
      initial={{ y: -40, opacity: 0, scale: 0.88 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -7, transition: { type: 'spring', stiffness: 400, damping: 18 } }}
      className="relative w-24 h-[136px]"
      style={{ perspective: '900px' }}
    >
      {/* Flip wrapper — rotates to show front or back */}
      <motion.div
        initial={{ rotateY: shouldShowBack ? 180 : 0 }}
        animate={{ rotateY: shouldShowBack ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Back face (pre-rotated 180° so it shows when outer is at 180°) */}
        <div
          className="absolute inset-0 rounded-xl bg-[#1a2744] border border-[#2d3d6b] shadow-lg"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="absolute inset-[6px] rounded-lg border border-[#2d3d6b]/60" />
          {/* Subtle diagonal pattern */}
          <div className="absolute inset-[6px] rounded-lg opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #c9a84c 0px, #c9a84c 1px, transparent 0px, transparent 50%)',
              backgroundSize: '8px 8px',
            }}
          />
        </div>

        {/* Front face */}
        <div
          className={`absolute inset-0 rounded-xl bg-white border border-neutral-200 shadow-md ${suitColor}`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Top-left corner */}
          <div className="absolute top-2 left-2.5 text-sm font-bold leading-tight font-[family-name:var(--font-playfair)]">
            <div>{c.rank}</div>
            <div>{c.suit}</div>
          </div>
          {/* Center suit */}
          <div className="flex h-full items-center justify-center text-4xl">
            {c.suit}
          </div>
          {/* Bottom-right corner (rotated) */}
          <div className="absolute bottom-2 right-2.5 text-sm font-bold leading-tight rotate-180 font-[family-name:var(--font-playfair)]">
            <div>{c.rank}</div>
            <div>{c.suit}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Player total display with result-based coloring and spring pop on result
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
    <motion.div
      key={result ?? 'none'}
      initial={result ? { scale: 0.75, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={
        result === 'win'
          ? { type: 'spring', stiffness: 520, damping: 12 }
          : { duration: 0.28 }
      }
      className={`px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold ${textColor}`}
    >
      {phase === 'BETTING' ? 'You' : `You: ${total}`}
    </motion.div>
  )
}
