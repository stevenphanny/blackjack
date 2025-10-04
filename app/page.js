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
  const [phase, setPhase] = useState('BETTING') // BETTING | PLAYER | DEALER | FINISHED
  const [player, setPlayer] = useState([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])      // Start with placeholder cards
  const [dealer, setDealer] = useState([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])      // Start with placeholder cards
  const [msg, setMsg] = useState('')
  const [gameResult, setGameResult] = useState(null) // 'win', 'loss', 'push', or null
  
  // Animation states
  const [newCardIndices, setNewCardIndices] = useState({ player: [], dealer: [] })
  const [revealDealerCard, setRevealDealerCard] = useState(false)

  // Memoized totals to avoid unnecessary recalculations - only calculate if cards are real
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

  /**
   * Starts a new game by resetting to betting phase with placeholder cards
   * @returns {void}
   */
  function newGame() {
    setPhase('BETTING')
    setPlayer([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
    setDealer([{ rank: '?', suit: '' }, { rank: '?', suit: '' }])
    setMsg('Place a bet and deal to start')
    setRevealDealerCard(false)
    setNewCardIndices({ player: [], dealer: [] })
    setGameResult(null) // Reset game result
  }

  /**
   * Deals the cards to start a new round in classic blackjack sequence:
   * 1st card: Player (visible)
   * 2nd card: Dealer (visible) 
   * 3rd card: Player (visible)
   * 4th card: Dealer (hidden)
   * @returns {void}
   */
  function deal() {
    if (phase !== 'BETTING') return
    if (bet < 1) return setMsg('Bet must be at least 1.')
    if (bet > chips) return setMsg('Bet exceeds your chip balance.')
    
    // Reset animation states
    setRevealDealerCard(false)
    setNewCardIndices({ player: [], dealer: [] })
    
    // Classic blackjack dealing sequence
    const card1 = drawCard() // Player's 1st card (visible)
    const card2 = drawCard() // Dealer's 1st card (visible)
    const card3 = drawCard() // Player's 2nd card (visible)
    const card4 = drawCard() // Dealer's 2nd card (face down)
    
    const p = [card1, card3]
    const d = [card2, card4]
    setPlayer(p)
    setDealer(d)
    
    // Trigger animations for new cards
    setNewCardIndices({ player: [0, 1], dealer: [0, 1] })
    
    // Clear animation states after animation completes
    setTimeout(() => {
      setNewCardIndices({ player: [], dealer: [] })
    }, 600)
    
    setPhase('PLAYER')
  }

  /**
   * Hit action: draw a card for the player, check for bust
   * @returns {void}
   */
  function hit() {
    if (phase !== 'PLAYER') return
    const newCard = drawCard()
    const next = [...player, newCard]
    setPlayer(next)
    
    // Animate the new card
    const newIndex = next.length - 1
    setNewCardIndices(prev => ({ ...prev, player: [newIndex] }))
    
    // Clear animation after it completes
    setTimeout(() => {
      setNewCardIndices(prev => ({ ...prev, player: [] }))
    }, 600)
    
    const t = calcHandTotal(next).total
    if (t > 21) {
      setGameResult('loss') // Set result for bust
      setMsg('Bust! Dealer wins')
      finish('loss', next, dealer)
    }
  }

  /**
   * Stand action: end the player's turn and switch to dealer's turn
   * @returns {void}
   */
  function stand() {
    if (phase !== 'PLAYER') return
    setPhase('DEALER')
    
    // Reveal dealer's hidden card with animation
    setRevealDealerCard(true)
    
    setTimeout(() => {
      const finalDealer = dealerAutoPlay(dealer)
      setDealer(finalDealer)
      
      // Animate any additional dealer cards
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
      setGameResult(result) // Store the game result
      setMsg(result === 'win' ? 'You win!' : result === 'loss' ? 'You lose' : 'Push')
      finish(result, player, finalDealer)
    }, 300) // Small delay for card reveal
  }

  /**
   * Finish the game: compute results, update chips, and persist game state
   * @param {*} result 
   * @param {*} finalPlayer 
   * @param {*} finalDealer 
   */
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
      setPhase('FINISHED')
    }
  }

  /**
   * Get AI recommendation for current blackjack hand
   * Calls the server-side API to get strategic advice from Google AI
   * @returns {void}
   */
  async function aiRecommendation() {
    if (phase !== 'PLAYER') {
      setMsg('AI recommendations are only available during your turn.')
      return
    }

    try {
      setMsg('Getting AI recommendation...')
      
      const response = await fetch('/api/ai/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCards: player,
          dealerUpCard: dealer[0], // Only the visible dealer card
          playerTotal: pTotal
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMsg(`AI ${data.recommendation}`)
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
      
      {/* Always show dealer and player sections */}
      <>
        {/* 
          DEALER SECTION 
          - Card visibility logic:
            * BETTING phase: Shows face-down placeholder cards
            * PLAYER phase: Shows first card face-up, second card hidden
            * DEALER/FINISHED phase: All cards visible
          - Animation features:
            * New cards fade in when dealt (isNew)
            * Hidden card flips when revealed (isRevealing)
        */}
        <section className="max-w-xl rounded-2xl p-4">
          {/* Card container - flexible wrap allows overflow to new line if many cards */}
          <div className="flex gap-2 flex-wrap">
            {dealer.map((c, i) => (
              <Card 
                key={`d-${i}`} 
                c={c} 
                // Hide cards during betting OR hide dealer's hole card (index 1) during player turn
                hidden={phase === 'BETTING' || (phase === 'PLAYER' && i === 1 && !revealDealerCard)} 
                // Trigger fade-in animation for newly dealt cards
                isNew={newCardIndices.dealer.includes(i)}
                // Trigger flip animation when revealing hole card
                isRevealing={i === 1 && revealDealerCard && phase === 'DEALER'}
                // Show placeholder styling during betting phase
                isPlaceholder={phase === 'BETTING'}
              />
            ))}
          </div>
          {/* Dealer total display - centered below cards */}
          <div className="flex justify-center mt-4">
            <div className="px-4 py-2 rounded-lg bg-neutral-800 text-white font-semibold">
              {(phase === 'DEALER' || phase === 'FINISHED') ? `Dealer: ${dTotal}` : "Dealer"}
            </div>
          </div>
        </section>

        {/* 
          PLAYER SECTION
          - Displays player's cards in a horizontal row with gap spacing  
          - Card visibility logic:
            * BETTING phase: Shows face-down placeholder cards (aesthetic)
            * PLAYER/DEALER/FINISHED phases: All cards always visible (no hidden cards)
          - Animation features:
            * New cards fade in when dealt or hit (isNew)
            * No flip animations needed (player cards always face-up)
          - Total display:
            * Hidden during betting phase (no cards dealt yet)
            * Always shown during active gameplay (player needs to see total)
        */}
        <section className="max-w-xl rounded-2xl p-4">
          {/* Card container - flexible wrap allows overflow if player has many cards */}
          <div className="flex gap-2 flex-wrap">
            {player.map((c, i) => (
              <Card 
                key={`p-${i}`} 
                c={c} 
                // Only hide cards during betting phase (placeholder mode)
                hidden={phase === 'BETTING'}
                // Trigger fade-in animation for newly dealt/hit cards
                isNew={newCardIndices.player.includes(i)}
                // Show placeholder styling during betting phase
                isPlaceholder={phase === 'BETTING'}
                // Note: Player cards never flip (isRevealing not used)
              />
            ))}
          </div>
          {/* Player total display - centered below cards with result-based coloring */}
          <div className="flex justify-center mt-4">
            <PlayerTotalDisplay 
              phase={phase} 
              total={pTotal} 
              result={gameResult} 
            />
          </div>
        </section>
      </>

      {/* Betting or Actions */}
      {phase === 'BETTING' ? (
        <>
        {/* Input box for betting chips */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={bet}
            min={1}
            onChange={e => setBet(Math.max(1, Number(e.target.value)))}
            className="w-24 px-2 py-1 rounded border border-neutral-700 bg-neutral-900 text-white"
          />
        </div>

        {/* Bet buttons */}
        <Button onClick={deal}>Deal</Button>
        <div className="flex gap-1">
          {[5,10,25,50,100].map(v => (
            <Button variant="bet_numbers" key={v} onClick={() => setBet(Math.min(v, chips))}>+{v}</Button>
          ))}
        </div>
        </>

      ) : phase === 'FINISHED' ? (
        <div className="flex gap-2">
          <Button onClick={newGame}>New Game</Button>
        </div>
      ) : (
        <div className="flex-wrap gap-2">
          <Button variant="hit_stand" onClick={hit}>Hit</Button>
          <Button variant="hit_stand" onClick={aiRecommendation}>?</Button>
          <Button variant="hit_stand" onClick={stand}>Stand</Button>
        </div>
      )}

      <div className="text-sm opacity-80">{msg}</div>
    </main>
  )
}

// Card UI with animations for dealing and revealing
function Card({ c, hidden, isNew, isRevealing, isPlaceholder }) {
  const baseClasses = "w-14 h-20 rounded border flex items-center justify-center font-semibold transition-all duration-300"
  
  // Animation classes using custom keyframes
  // Fade in for new cards
  const animationClasses = isNew ? "animate-[fadeIn_0.6s_ease-in-out_forwards]" : ""
  // Flip animation for revealing dealer's card
  const revealClasses = isRevealing ? "animate-[flip_0.5s_ease-in-out]" : ""
  
  // Show face-down cards during betting phase or when hidden
  if (hidden || isPlaceholder) {
    return (
      <div className={`${baseClasses} bg-neutral-700 border-neutral-600 ${animationClasses} ${revealClasses}`} />
    )
  }
  
  return (
    <div className={`${baseClasses} bg-white text-neutral-900 border-neutral-300 ${animationClasses} ${revealClasses}`}>
      {c.rank}{c.suit}
    </div>
  )
}

/**
 * Player Total Display Component with result-based coloring
 * Shows different colors based on game outcome: green (win), yellow (push), red (loss)
 */
function PlayerTotalDisplay({ phase, total, result }) {
  // Don't show total during betting phase
  if (phase === 'BETTING') {
    return (
      <div className="px-4 py-2 rounded-lg bg-neutral-800 text-white font-semibold">
        You
      </div>
    )
  }

  // Determine color based on game result (only applies in FINISHED phase)
  let colorClasses = "bg-neutral-800 text-white" // Default neutral styling
  
  if (phase === 'FINISHED' && result) {
    switch (result) {
      case 'win':
        colorClasses = "bg-green-800 text-white" // Green for wins
        break
      case 'loss':
        colorClasses = "bg-red-800 text-white" // Red for losses  
        break
      case 'push':
        colorClasses = "bg-yellow-500 text-black" // Yellow for pushes
        break
      default:
        colorClasses = "bg-neutral-800 text-white"
    }
  }

  return (
    <div className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${colorClasses}`}>
      You: {total}
    </div>
  )
}
