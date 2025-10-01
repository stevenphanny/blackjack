import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

/**
 * GET /api/games/history - Fetch game history for a specific client
 * 
 * Query Parameters:
 * - clientId: The unique browser/user identifier
 * 
 * Returns:
 * - games: Array of game objects with formatted field names
 * - total: Number of games returned
 * 
 * Database Table: 'games'
 * - Filters by 'user_id' column (matches clientId)
 * - Orders by 'created_at' descending (newest first)
 * - Limits to 50 most recent games
 */
export async function GET(request) {
  try {
    // Extract query parameters from the URL
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    // Validate that clientId was provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }
    // Create Supabase client with server-side credentials
    const supabase = supabaseServer()

    // Query the 'games' table for this user's game history
    const { data: games, error } = await supabase
      .from('games')                              // Target the games table
      .select('*')                               // Select all columns
      .eq('user_id', clientId)                   // Filter by user_id (stored when game is settled)
      .order('created_at', { ascending: false }) // Newest games first


    // Handle database query errors
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch game history' },
        { status: 500 }
      )
    }

    // Transform database field names to match frontend expectations
    // Database uses snake_case, frontend expects camelCase
    const transformedGames = games.map(game => ({
      id: game.id,                           // Unique game ID
      bet: game.bet,                         // Amount bet on this game
      result: game.result,                   // 'win', 'loss', or 'push'
      delta: game.delta,                     // Chip change (+/- amount)
      playerTotal: game.player_total,        // Player's final hand total
      dealerTotal: game.dealer_total,        // Dealer's final hand total
      createdAt: game.created_at,           // When game was played
      timestamp: game.created_at            // Alternative field name for compatibility
    }))

    // Return the transformed games array and count
    return NextResponse.json({
      games: transformedGames,
      total: transformedGames.length
    })

  } catch (error) {
    // Catch any unexpected errors (network, parsing, etc.)
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}