'use client'
import { useEffect, useState } from 'react'
import { getClientId } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

/**
 * History Page Component - Displays the user's blackjack game history
 * Shows past games with results, betting amounts, and summary statistics
 */
export default function HistoryPage() {
  // Array of game objects fetched from the database
  const [games, setGames] = useState([])

  // On component mount, get the client ID and fetch game history
  useEffect(() => {
    const clientId = getClientId() // Get unique browser/user ID from localStorage
    fetchGameHistory(clientId)
  }, [])

  /**
   * Fetches the game history for a specific client from the API
   * @param {string} clientId - The unique identifier for this browser/user
   */
  async function fetchGameHistory(clientId) {
    try {
      // Call our custom API endpoint that queries the games table
      const res = await fetch(`/api/games/history?clientId=${clientId}`)
      const data = await res.json()
      
      
      if (res.ok) {
        // Update state with the games array, fallback to empty array if undefined
        setGames(data.games || [])
      } else {
        console.error('Failed to fetch history:', data.error)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } 
  }

  /**
   * Formats the game result for display with appropriate styling
   * @param {string} result - The game result ('win', 'loss', or 'push')
   * @returns {Object} Object with display text and CSS class name
   */
  function formatResult(result) {
    const resultMap = {
      win: { text: 'Win', className: 'text-green-400' },   // Green for wins
      loss: { text: 'Loss', className: 'text-red-400' },   // Red for losses
      push: { text: 'Push', className: 'text-yellow-400' } // Yellow for ties/pushes
    }
    // Return mapped result or fallback to gray for unknown results
    return resultMap[result] || { text: result, className: 'text-gray-400' }
  }


  return (
    /**
     * Flex container centering content with padding
     * Min-h-full ensures it fills at least the viewport height
     * flex-col stacks children vertically
     * px-4 py-8 adds horizontal and vertical padding
     */
    <main className="flex min-h-full flex-col items-center px-4 py-8">
      {/* Game History Header with navigation and title */}
      <div className="w-full max-w-2xl mb-6">
        <Link href="/">
          <Button variant="outline" className="mb-4">
            ← Back to Game
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-white">Game History</h1>
      </div>

      {/* Summary Statistics - only show if user has played games */}
      {games.length > 0 && (
        <div className="w-full max-w-2xl my-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total number of games played */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{games.length}</div>
            <div className="text-gray-400">Total Games</div>
          </div>
          {/* Number of wins */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {games.filter(g => g.result === 'win').length}
            </div>
            <div className="text-gray-400">Wins</div>
          </div>
          {/* Win percentage calculation */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {games.length > 0 ? Math.round((games.filter(g => g.result === 'win').length / games.length) * 100) : 0}%
            </div>
            <div className="text-gray-400">Win Rate</div>
          </div>
        </div>
      )}

      {/* Games List - shows either empty state or list of games */}
      <div className="w-full max-w-2xl my-4">
        {games.length === 0 ? (
          /* Empty state when no games have been played */
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No games played yet</div>
            <Link href="/">
              <Button className="mt-4">Play Your First Game</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Map through each game and create a card for it */}
            {games.map((game, index) => {
              const resultInfo = formatResult(game.result)
              return (
                <div
                  key={game.id || index}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center justify-between"
                >
                  {/* Left side: Game details */}
                  <div className="flex items-center gap-4">
                    {/* Game date and time */}
                    <div className="text-sm text-gray-400">
                      {new Date(game.createdAt || game.timestamp).toLocaleDateString()}  
                      {' '}
                      {new Date(game.createdAt || game.timestamp).toLocaleTimeString()}
                    </div>

                    {/* Bet amount */}
                    <div className="text-white">
                      Bet: <span className="font-semibold">{game.bet}</span> chips
                    </div>
                    {/* Final hand totals */}
                    <div className="text-white">
                      You: {game.playerTotal} | Dealer: {game.dealerTotal}
                    </div>
                  </div>
                  
                  {/* Right side: Result and chip change */}
                  <div className="flex items-center gap-3">
                    {/* Win/Loss/Push result with colored text */}
                    <div className={`font-semibold ${resultInfo.className}`}>
                      {resultInfo.text}
                    </div>
                    {/* Chip change (+/- amount) with color coding */}
                    <div className={`font-semibold ${game.delta > 0 ? 'text-green-400' : game.delta < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {game.delta > 0 ? '+' : ''}{game.delta}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      
    </main>
  )
}
