'use client'
import { useEffect, useState, useMemo } from 'react'
import { getClientId } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'


/**
 * History Page Component - Displays the user's blackjack game history
 * Shows past games with results, betting amounts, and summary statistics
 */
export default function HistoryPage() {
  // Array of game objects fetched from the database
  const [games, setGames] = useState([])
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 5 // Number of games to show per page

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

  /**
   * Calculate pagination data using useMemo to avoid recalculation on every render
   * Dependencies: games array, currentPage, gamesPerPage
   * Returns: totalPages, currentGames (games for current page), hasNextPage, hasPrevPage
   */
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(games.length / gamesPerPage)
    const startIndex = (currentPage - 1) * gamesPerPage
    const endIndex = startIndex + gamesPerPage
    const currentGames = games.slice(startIndex, endIndex)
    
    return {
      totalPages,
      currentGames,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    }
  }, [games, currentPage, gamesPerPage])

  /**
   * Handle page navigation
   * @param {number} page - The page number to navigate to
   */
  function handlePageChange(page) {
    if (page >= 1 && page <= paginationData.totalPages) {
      setCurrentPage(page)
    }
  }

  /**
   * Generate smart pagination items with ellipsis
   * Shows: [1] [2] [3] [...] [13] for many pages
   */
  function generatePaginationItems() {
    const { totalPages } = paginationData
    const items = []

    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={currentPage === 1}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    )

    // Show ellipsis if current page is > 3
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) { // Don't duplicate first/last
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    }

    // Show ellipsis if current page is < totalPages - 2
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
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
          {/* Total number of games played card*/}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{games.length}</div>
            <div className="text-gray-400">Total Games</div>
          </div>
          {/* Number of wins card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {games.filter(g => g.result === 'win').length}
            </div>
            <div className="text-gray-400">Wins</div>
          </div>
          {/* Win percentage calculation card */}
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
          <>
            {/* List of paginated game history cards */}
            <div className="space-y-3">
              {/* Map through each paginated game and create a card for it */}
              {paginationData.currentGames.map((game, index) => {
                const resultInfo = formatResult(game.result)
                return (
                  <div
                    key={game.id || index}
                    className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center justify-between"
                  >
                    {/* Left side: Game details */}
                    <div className="flex items-center gap-4">
                      {/* Game date and time */}
                      <div className="row">
                        <div className='col text-sm text-gray-400 font-semibold'>
                          Date
                        </div>
                        <div className='col text-sm font-bold'>{new Date(game.createdAt || game.timestamp).toLocaleDateString()} {' '}{new Date(game.createdAt || game.timestamp).toLocaleTimeString()}</div>
                      </div>

                      {/* Bet amount */}
                      <div className="row mx-4">
                        <div className='col text-sm text-gray-400 font-semibold'>
                          Bet
                        </div>
                        <div className='col text-sm font-bold'>{game.bet} chips</div>
                      </div>


                      {/* Final hand totals */}
                      <div className="row mx-4">
                        <div className='col text-sm text-gray-400 font-semibold'>
                          Score
                        </div>
                        <div className='col text-sm font-bold'>You: {game.playerTotal} | Dealer: {game.dealerTotal}</div>
                      </div>

                    </div>
                    
                    {/* Right side: Result and chip change */}
                    <div className="row mx-4">
                      <div className='col text-sm text-gray-400 font-semibold'>
                        Result
                      </div>
                      <div className={`col text-md font-bold ${resultInfo.className}`}>{resultInfo.text} ({game.delta > 0 ? '+' : game.delta === 0 ? '=' : ''}{game.delta})</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination info */}
            <div className="text-center text-xs mt-5 text-gray-400">
              Showing {((currentPage - 1) * gamesPerPage) + 1} to {Math.min(currentPage * gamesPerPage, games.length)} of {games.length} games
            </div>
            
            {/* Pagination Controls - only show if there are multiple pages */}
            {paginationData.totalPages > 1 && (
              <div className="mt-3 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {/* Previous Page Button */}
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={!paginationData.hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {/* Smart Page Numbers with Ellipsis */}
                    {generatePaginationItems()}
                    
                    {/* Next Page Button */}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={!paginationData.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      
    </main>
  )
}
