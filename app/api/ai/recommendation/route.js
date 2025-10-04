import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

/**
 * POST /api/ai/recommendation - Get blackjack strategy recommendation from AI
 * 
 * Request body:
 * - playerCards: Array of player's cards
 * - dealerUpCard: Dealer's visible card
 * - playerTotal: Player's current total
 * 
 * Returns AI recommendation for optimal blackjack play
 */
export async function POST(request) {
  try {
    const { playerCards, dealerUpCard, playerTotal } = await request.json()
    
    // Validate input
    if (!playerCards || !dealerUpCard || playerTotal === undefined) {
      return NextResponse.json(
        { error: 'Missing required game state information' },
        { status: 400 }
      )
    }
    
    // Initialize Google AI with API key from environment
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    // Create context-aware prompt for blackjack strategy
    const prompt = `
You are a professional blackjack strategy advisor. Given the current game state, provide a brief recommendation (Hit or Stand) with a short explanation.

Current situation:
- Your cards: ${playerCards.map(c => `${c.rank}${c.suit}`).join(', ')}
- Your total: ${playerTotal}
- Dealer's up card: ${dealerUpCard.rank}${dealerUpCard.suit}

Provide a recommendation in this exact format:
"Recommendation: [Hit/Stand]. \n[Brief 1-sentence explanation based on basic strategy. Don't do Explanation: ... format. Just give me the short explanation.]"

Keep the explanation short but informative.`

    // Generate AI recommendation
    const result = await model.generateContent(prompt)
    const fullResponse = result.response.text()
    
    // Parse the recommendation to extract action and explanation
    let action = 'Hit or Stand'
    let explanation = fullResponse
    
    // Try to extract structured response
    const match = fullResponse.match(/Recommendation:\s*(Hit|Stand)\s*\.?\s*\n?(.*)/is)
    if (match) {
      action = match[1]  // "Hit" or "Stand"
      explanation = match[2].trim()  // The explanation part
    } else {
      // Fallback: try to find Hit/Stand in the response
      const simpleMatch = fullResponse.match(/(Hit|Stand)/i)
      if (simpleMatch) {
        action = simpleMatch[1]
        explanation = fullResponse.replace(/Recommendation:\s*/i, '').replace(new RegExp(action, 'i'), '').trim()
      }
    }
    
    return NextResponse.json({ 
      action, 
      explanation,
      fullResponse // Keep original for debugging if needed
    })
    
  } catch (error) {
    console.error('AI recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendation' },
      { status: 500 }
    )
  }
}   