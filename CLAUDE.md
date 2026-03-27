# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint (Next.js core-web-vitals)
```

There are no automated tests configured.

## Environment Setup

Requires `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-side Supabase access
- `SUPABASE_SERVICE_ROLE` — server-side Supabase (API routes only)
- `GEMINI_API_KEY` — Google Gemini API for AI recommendations

## Architecture

**Next.js 15 App Router** with React 19, Tailwind CSS 4, and shadcn/ui components.

### Game Flow

1. Player sets a bet → clicks Deal
2. 4 cards dealt (player-dealer-player-dealer-hidden)
3. Player hits/stands (optional AI recommendation from Gemini)
4. Dealer auto-plays (hits until 17+) via `dealerAutoPlay()` in `lib/blackjack.js`
5. Result settled: chips updated in Supabase, game recorded

### Key Files

| File | Role |
|------|------|
| `app/page.js` | Main game UI — all game state, betting, card display, animations |
| `lib/blackjack.js` | Pure game logic: `drawCard()`, `calcHandTotal()`, `dealerAutoPlay()`, `resolveResult()` |
| `lib/storage.js` | Client-side helpers: `getClientId()` (localStorage UUID), `getChips()`, `apiBuyChips()` |
| `lib/supabaseServer.js` | Server-side Supabase client (used in API routes) |
| `app/api/chips/buy/route.js` | Upserts `profiles` row, calls `increment_chips()` RPC |
| `app/api/games/settle/route.js` | POST records game in `games` table + updates chips; GET returns history |
| `app/api/ai/recommendation/route.js` | Calls Gemini 2.5 Flash, returns Hit/Stand advice |
| `app/history/page.js` | Paginated game history with win-rate stats |
| `components/navbar.jsx` | Balance display + "Add Chips" button; responsive (desktop nav + mobile sheet) |
| `components/buy-chips-dialog.jsx` | Chip purchase UI (100/500/1000/5000 options) |

### Chip Balance Sync

Client ID is a UUID stored in `localStorage`. The chip balance lives in Supabase `profiles(id, chips)` and is updated atomically via the `increment_chips(user_id, amount)` RPC function. Cross-component balance updates are coordinated via a custom DOM event (`chipsUpdated`) — the navbar listens for this event to refresh the displayed balance without a page reload.

### Supabase Schema (expected)

- `profiles` table: `id` (text, PK), `chips` (integer)
- `games` table: `user_id`, `bet`, `result`, `chip_delta`, `player_total`, `dealer_total`, `created_at`
- `increment_chips(user_id text, amount int)` — RPC function for atomic updates
