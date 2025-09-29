export const suits = ['♠','♥','♦','♣']
export const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']


/**
 * Draws a random card from the deck
 * @returns {Object} - The drawn card with suit and rank
 */
export function drawCard() {
  return { suit: suits[Math.floor(Math.random()*4)], rank: ranks[Math.floor(Math.random()*13)] }
}

/**
 * Calculates the total value of a hand of cards
 * @param {Array} cards - The array of card objects
 * @returns {Object} - The total value and whether the hand is soft (has an Ace counted as 11)
 */
export function calcHandTotal(cards) {
  let total = 0, aces = 0
  for (const c of cards) {
    if (c.rank === 'A') { aces++; total += 11 }
    else if (['J','Q','K'].includes(c.rank)) total += 10
    else total += Number(c.rank)
  }
  // Change ace value to 1 if total > 21
  while (total > 21 && aces > 0) { 
    total -= 10; aces-- 
}
  return { total, soft: aces > 0 }
}

/**
 * Simulates the dealer's autoplay logic
 * @param {Array} initial - The initial hand of the dealer
 * @returns {Array} - The final hand of the dealer after autoplay
 */
export function dealerAutoPlay(initial) {
  let hand = [...initial] // Spread operator to copy array
  while (calcHandTotal(hand).total <= 16) hand.push(drawCard())
  return hand
}

/**
 * Resolves the result of a blackjack game round
 * @param {Array} player - The player's hand
 * @param {Array} dealer - The dealer's hand
 * @returns {string} - The result of the round ("win", "loss", "push")
 */
export function resolveResult(player, dealer) {
  const playerVal = calcHandTotal(player).total
  const dealerVal = calcHandTotal(dealer).total
  if (playerVal > 21) return 'loss'
  if (dealerVal > 21) return 'win'
  if (playerVal > dealerVal) return 'win'
  if (playerVal < dealerVal) return 'loss'
  return 'push' //draw
}
