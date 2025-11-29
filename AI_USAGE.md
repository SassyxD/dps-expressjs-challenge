# AI Usage Documentation

> **Note:** This documentation was written by me based on my actual development experience. I used AI (ChatGPT) to help improve the grammar, wording, and structure to make it more readable and professional, but all the content, technical details, problems encountered, and solutions described are from my real development process.

## Overview
This document tracks AI tool usage during the development of the Round-Robin Tournament Service, as required by the challenge guidelines. I tried to balance AI assistance with manual implementation to learn the concepts while being productive.

---

## Development Timeline & AI Assistance

### November 29, 2025 - 2:30 PM to 6:45 PM (~4 hours 15 min)

---

## Session 1: Planning & Database Schema (2:30 PM - 3:00 PM)

### Manual Work:
- Read through README.md requirements multiple times
- Drew the ER diagram on paper:
  - Tournaments (1) → (N) Tournament_Participants (N) ← (1) Players
  - Tournaments (1) → (N) Games
  - Realized I need a junction table for the many-to-many relationship
- Calculated round-robin math: For n players, total games = n × (n-1) / 2
- Decided on table structure and field names

### AI Assistance: None
This was pure planning - wanted to understand the domain properly before coding.

---

## Session 2: Database Initialization (3:00 PM - 3:25 PM)

### What I Built:
Created `src/db/init.ts` with table schemas

### AI Usage - GitHub Copilot:

**Prompt Context:** Started typing `CREATE TABLE tournaments`

**Copilot Suggestion:**
```sql
CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**My Action:** Accepted the suggestion - this was boilerplate SQL, made sense

**Next Issue:** Wasn't sure about the UNIQUE constraint syntax for composite keys

**Manual Search:** Googled "sqlite unique constraint multiple columns"

**Result:** Found I need `UNIQUE(tournament_id, player_id)` in the junction table

**Copilot Help:** When I typed "UNIQUE", it autocompleted with the right syntax

### Problems Encountered:

**Problem 1:** Initially created `player1_id` and `player2_id` with separate UNIQUE constraints
```sql
UNIQUE(tournament_id, player1_id),
UNIQUE(tournament_id, player2_id)
```

**Issue:** This wouldn't prevent Alice vs Bob AND Bob vs Alice from both being recorded

**How I Fixed:** Changed to single constraint checking both orders in application logic instead
- Removed duplicate constraints
- Added logic in the route to check `(p1, p2) OR (p2, p1)`
- Spent about 10 minutes thinking through this

**Time on this section:** 25 minutes (20 min coding, 5 min research)

---

## Session 3: Routes Implementation (3:25 PM - 4:30 PM)

### Players Route (`src/routes/players.ts`)

**Manual Work:**
- Wrote the router boilerplate from memory
- Created POST, GET all, GET by ID endpoints structure
- Implemented request validation

**AI Usage - Copilot:**

**Issue 1:** Forgot the exact syntax for better-sqlite3 `run()` return value

**What I Did:** Typed `const result = db.run(` and Copilot suggested:
```typescript
const result = db.run('INSERT INTO players (name) VALUES (?)', { 1: name });
```

**My Reaction:** Used it, seemed right (spoiler: this caused problems later!)

**Issue 2:** Error handling for UNIQUE constraint violations

**Prompt to Copilot Chat:** "how to catch unique constraint error in better-sqlite3"

**Copilot Response:** Suggested checking `error.message.includes('UNIQUE')`

**My Implementation:**
```typescript
catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
        res.status(400).json({ error: 'Player name already exists' });
    } else {
        res.status(500).json({ error: 'Failed to create player' });
    }
}
```

Worked perfectly!

### Tournaments Route (`src/routes/tournaments.ts`)

**Big Challenge:** Adding players to tournament with capacity check

**Manual Work:**
- Wrote the structure myself
- Validation for empty player_id
- Check if tournament exists
- Check if player exists

**AI Assistance:**

**Prompt (mental note, typed in comments):** `// check if tournament has less than 5 players`

**Copilot Generated:**
```typescript
const participants = db.query(
    'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ?',
    { 1: id }
);
```

**My Addition:** Added the comparison logic manually:
```typescript
if (participants[0] && (participants[0] as { count: number }).count >= 5) {
    res.status(400).json({ error: 'Tournament is full (max 5 players)' });
    return;
}
```

**TypeScript Problem:** Copilot's type assertion `(participants[0] as { count: number })` was awkward

**Manual Fix:** Kept it for now, noted to refactor later with proper interfaces

**Time on routes:** ~65 minutes

---

## Session 4: Game Recording Logic (4:30 PM - 5:15 PM)

This was the trickiest part.

### Challenge: Prevent duplicate games (Alice vs Bob = Bob vs Alice)

**Manual Work:**
- Wrote all the validation logic
- Player 1 and Player 2 can't be the same
- Both players must be in the tournament
- Point calculation algorithm (completely manual)

**AI Usage - ChatGPT:**

**My Prompt:**
```
I need a SQL query to check if a game exists between two players in either direction.
Table: games (tournament_id, player1_id, player2_id)
Need to check: (tournament_id AND ((player1 AND player2) OR (player2 AND player1)))
```

**ChatGPT Response:**
```sql
SELECT * FROM games 
WHERE tournament_id = ? 
AND ((player1_id = ? AND player2_id = ?) 
     OR (player1_id = ? AND player2_id = ?))
```

**My Action:** Used this directly - it was exactly what I needed!

**Parameters:** Had to figure out the parameter order myself: `[tournamentId, p1, p2, p2, p1]`

### Point Update Logic

**Manual Implementation:**
```typescript
let player1Points = 0;
let player2Points = 0;

if (player1_score > player2_score) {
    player1Points = 2; // Win
    player2Points = 0; // Loss
} else if (player1_score < player2_score) {
    player1Points = 0;
    player2Points = 2;
} else {
    player1Points = 1; // Draw
    player2Points = 1;
}
```

100% manual - wanted to understand the logic clearly.

**AI Help:** Used Copilot for the UPDATE statements

**Copilot Suggestion:**
```typescript
db.run(
    'UPDATE tournament_participants SET points = points + ? WHERE tournament_id = ? AND player_id = ?',
    { 1: player1Points, 2: tournamentId, 3: player1_id }
);
```

Accepted - clean and simple.

**Time:** 45 minutes (30 min coding, 15 min testing manually)

---

## Session 5: Leaderboard Endpoint (5:15 PM - 5:50 PM)

### The Complex SQL Query

**Initial Attempt (Manual):**
```sql
SELECT player_id, points FROM tournament_participants 
WHERE tournament_id = ? 
ORDER BY points DESC
```

**Problem:** This didn't include player names or games played count

**ChatGPT Prompt:**
```
Write a SQL query to get tournament leaderboard with:
- Player name from players table
- Points from tournament_participants
- Count of games played
Use LEFT JOIN because some players might not have played yet
```

**ChatGPT Response:**
```sql
SELECT 
    tp.player_id,
    p.name as player_name,
    tp.points,
    COUNT(DISTINCT g.id) as games_played
FROM tournament_participants tp
JOIN players p ON tp.player_id = p.id
LEFT JOIN games g ON 
    g.tournament_id = tp.tournament_id 
    AND (g.player1_id = tp.player_id OR g.player2_id = tp.player_id)
WHERE tp.tournament_id = ?
GROUP BY tp.player_id, p.name, tp.points
ORDER BY tp.points DESC, p.name ASC
```

**My Reaction:** Perfect! This is exactly what I needed.

**My Addition:** Added the secondary sort by `p.name ASC` for alphabetical ordering when points are tied (actually ChatGPT included this!)

### Tournament Status Logic (Manual)

**My Implementation:**
```typescript
let status: string;
if (participantCount === 0) {
    status = 'planning';
} else if (gamesPlayed === 0) {
    status = 'planning';
} else if (gamesPlayed < totalRequiredGames) {
    status = 'in_progress';
} else {
    status = 'completed';
}
```

**Why Manual:** I wanted to think through all the edge cases myself
- No players = planning
- Players but no games = planning (alternative: "ready")
- Some games = in_progress
- All games = completed

**Time:** 35 minutes

---

## Session 6: The Big Bug - Database Parameters (5:50 PM - 6:30 PM)

### The Crisis Moment

Started testing with Postman...

**First Request:**
```bash
POST /api/players
{"name": "Alice"}
```

**Response:** `{"error": "Failed to create player"}`

### Debugging Process

**Step 1:** Added console.log to see the actual error

**Copilot Help:** When I typed `console.error(`, it suggested `'Error creating player:', error`

**Terminal Output:**
```
Error creating player: Error: SQLite: bind parameter out of range
```

**Step 2:** Googled "better-sqlite3 bind parameter out of range"

**Found:** better-sqlite3 uses **positional parameters (arrays)**, not named parameters (objects)!

**The Problem:**
```typescript
// WRONG (what I had):
db.run('INSERT INTO players (name) VALUES (?)', { 1: name });

// CORRECT:
db.run('INSERT INTO players (name) VALUES (?)', [name]);
```

**My Feeling:**  Copilot led me astray! Or... I should have read the docs.

### The Fix

**Manual Work:**
- Went through EVERY single file
- Changed all `{ 1: value }` to `[value]`
- Changed all `{ 1: val1, 2: val2 }` to `[val1, val2]`

**Files Modified:**
- `src/routes/players.ts` - 3 changes
- `src/routes/tournaments.ts` - 7 changes  
- `src/routes/games.ts` - 5 changes
- `src/routes/leaderboard.ts` - 3 changes
- `src/services/db.service.ts` - Updated type from `any` to `unknown[]`

**Linting Errors:** ESLint complained about CRLF line endings and `any` type

**Fix:** Ran `npm run format` - auto-fixed 350+ errors!

**Remaining:** Had to manually fix `@typescript-eslint/no-unused-vars` warnings
- Changed `catch (error)` to `catch` where error wasn't used
- Changed `params?: any` to `params?: unknown[]`

**Time on bug:** 40 minutes of frustration! 

### Lessons Learned:
1. Always read the library documentation, don't trust AI blindly
2. Copilot's suggestions might be outdated or wrong
3. Test early and often - caught this before going too far

---

## Session 7: Testing & Validation (6:30 PM - 6:45 PM)

### Manual Testing

**Created PowerShell Test Script:**
- Started manually typing test commands
- Got tedious quickly

**Tried:** Creating automated test script

**First Attempt:** Used Copilot to generate JSON bodies - worked well!

**Second Issue:** PowerShell escaping with backticks was a nightmare

**Solution:** Manually wrote simple string interpolation with `"{`"name`":`"$name`"}"`

### Test Results

**Created:**
- 5 players 
- 1 tournament  
- Added all players 
- Recorded 10 games (complete round-robin) 

**Verified:**
- Status changed: planning → in_progress → completed 
- Points calculated correctly 
- Leaderboard sorted properly 
- No duplicate games allowed 

**Final Rankings:**
1. Alice - 7 points (2+2+1+2 from 4 games)
2. Charlie - 6 points  
3. Eve - 3 points
4. Bob - 2 points
5. Diana - 2 points

Math checks out! 

**Time:** 15 minutes

---

---

## Detailed AI Tool Usage Summary

### GitHub Copilot

**What It Helped With:**
- SQL syntax and boilerplate code
- TypeScript type assertions
- Error handling patterns (try-catch blocks)
- Express route structure autocomplete
- Parameter suggestions for database queries

**Where It Failed Me:**
- Suggested wrong parameter format (`{ 1: value }` instead of `[value]`)
- Sometimes suggested outdated patterns
- Type assertions were often awkward (`as { count: number }`)

**Overall Value:** 7/10 - Good for boilerplate, bad for library-specific details

### ChatGPT (GPT-4)

**Specific Prompts Used:**

1. **SQL Query for Duplicate Game Detection:**
   - **Prompt:** "I need a SQL query to check if a game exists between two players in either direction. Table: games (tournament_id, player1_id, player2_id)"
   - **Response Quality:** Perfect - exactly what I needed
   - **Modifications:** None, used as-is

2. **Leaderboard Query:**
   - **Prompt:** "Write a SQL query to get tournament leaderboard with player name, points, and count of games played using LEFT JOIN"
   - **Response Quality:** Excellent - included proper JOINs and GROUP BY
   - **Modifications:** None

3. **better-sqlite3 Documentation:**
   - **Prompt:** "how to use better-sqlite3 run method parameters"
   - **Response Quality:** Would have helped, but I Googled this instead after the bug
   - **Never Actually Asked:** I fixed it through documentation

**Overall Value:** 9/10 - Very helpful for complex SQL

### Google Search

**Key Searches:**
1. "sqlite unique constraint multiple columns" - Found syntax
2. "better-sqlite3 bind parameter out of range" - Found the array vs object issue
3. "express typescript request response types" - When types weren't importing

**Overall Value:** 10/10 - Documentation is king!

---

## Code Authorship Breakdown

### 100% Manual (No AI):
- `src/db/init.ts` - Database schema design (AI only helped with SQL syntax)
- Point calculation algorithm in `src/routes/games.ts` (lines 67-77)
- Tournament status logic in `src/routes/leaderboard.ts` (lines 39-49)
- All validation logic across all routes
- All business logic and algorithms
- Route integration in `src/index.ts`
- Database service architecture decisions
- Test script structure and logic

### AI-Generated, Then Modified:
- Complex SQL queries (2 queries from ChatGPT, then integrated)
- Error handling patterns (Copilot suggestions, then customized)
- Route handler boilerplate (Copilot autocomplete, then filled in logic)

### AI-Generated, Used As-Is:
- SQL query for duplicate game detection (from ChatGPT)
- Leaderboard JOIN query (from ChatGPT)
- Some TypeScript type assertions (from Copilot)
- Basic try-catch structures

---

## Problems & How I Solved Them

### Problem 1: Database Parameter Format  BIGGEST ISSUE

**Initial Code:**
```typescript
db.run('INSERT INTO players (name) VALUES (?)', { 1: name });
```

**Error:**
```
SQLite: bind parameter out of range
```

**How I Found Solution:**
1. Added console.error logging
2. Googled the error message  
3. Found better-sqlite3 documentation
4. Realized it needs arrays, not objects

**AI Involvement:** None - Copilot actually caused this issue!

**Time to Fix:** 40 minutes

**Fix Applied:**
```typescript
db.run('INSERT INTO players (name) VALUES (?)', [name]);
```

### Problem 2: Preventing Duplicate Games

**Challenge:** Alice vs Bob and Bob vs Alice should be the same game

**Initial Attempt:** Used UNIQUE constraint on `(tournament_id, player1_id, player2_id)`

**Issue:** This doesn't prevent Bob vs Alice if Alice vs Bob exists

**Solution:**
1. Removed strict database constraint
2. Added application-level check with OR condition
3. Used ChatGPT for the SQL query

**ChatGPT Prompt:** "SQL to check game exists in either direction"

**Result:**
```sql
WHERE tournament_id = ? 
AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))
```

**AI Involvement:** 80% - ChatGPT gave me the query, I integrated it

**Time:** 15 minutes thinking + 5 minutes implementing

### Problem 3: Leaderboard Not Showing Player Names

**Issue:** First query only returned player_id and points

**Solution:** Needed JOIN with players table

**Attempt 1 (Manual):**
```sql
SELECT tp.player_id, tp.points, p.name 
FROM tournament_participants tp, players p
WHERE tp.player_id = p.id
```

**Problem:** Old-style join, also missing games_played count

**ChatGPT Solution:** Complete query with LEFT JOIN and COUNT

**AI Involvement:** 90% - ChatGPT wrote the entire query

**Time:** 10 minutes

### Problem 4: TypeScript Linting Errors (350+ errors!)

**Issue:** After fixing database params, `npm run format` showed 356 errors

**Errors:**
- CRLF line endings (350 errors)
- Unused variables (4 errors)
- `any` type usage (2 errors)

**Solution:**
1. Ran `npm run format` - auto-fixed 350 errors
2. Manually changed `catch (error)` to `catch` where unused
3. Changed `any` to `unknown[]` in db.service.ts

**AI Involvement:** None - this was all manual cleanup

**Time:** 10 minutes

### Problem 5: Tournament Status Logic Edge Cases

**Challenge:** What status should a tournament with players but no games be?

**Options:**
- "planning" - Makes sense, not started
- "ready" - Could be a separate state
- "in_progress" - Misleading, no games yet

**Decision:** Chose "planning" for simplicity

**Code:**
```typescript
if (participantCount === 0) {
    status = 'planning';
} else if (gamesPlayed === 0) {
    status = 'planning';  // ← This decision
} else if (gamesPlayed < totalRequiredGames) {
    status = 'in_progress';
} else {
    status = 'completed';
}
```

**AI Involvement:** None - pure logic decision

**Alternative Considered:** Could have had "ready" status for "has players but no games"

---

## Testing & Verification

### Manual Testing Process:

**Test 1: Create Players**
```bash
POST /api/players {"name": "Alice"}
```
 Response: `{"id": 1, "name": "Alice"}`

**Test 2: Duplicate Player**
```bash
POST /api/players {"name": "Alice"}
```
 Response: `{"error": "Player name already exists"}`

**Test 3: Add 6th Player to Tournament**
```bash
POST /api/tournaments/1/players {"player_id": 6}
```
 Response: `{"error": "Tournament is full (max 5 players)"}`

**Test 4: Duplicate Game**
```bash
POST /api/tournaments/1/games 
{"player1_id": 1, "player2_id": 2, "player1_score": 3, "player2_score": 1}

# Then reverse:
POST /api/tournaments/1/games 
{"player1_id": 2, "player2_id": 1, "player1_score": 1, "player2_score": 3}
```
 Response: `{"error": "Game between these players already recorded"}`

**Test 5: Point Calculation**
- Alice beats Bob 3-1 → Alice gets 2 points 
- Charlie draws Diana 2-2 → Both get 1 point 
- Eve loses to Alice 0-2 → Eve gets 0 points 

**Test 6: Tournament Status**
- 0 games: "planning" 
- 4 games (of 10): "in_progress" 
- 10 games (complete): "completed" 

All tests passed! 

---

## Reflection & Lessons Learned

### What Worked Well:

 **Using ChatGPT for complex SQL queries**
- Saved me from writing complex JOINs from scratch
- Got correct syntax immediately
- Would have taken 30+ minutes manually

 **Manual implementation of business logic**
- Understanding point calculation myself was crucial
- I can now explain how the system works
- Feel confident about the code

 **Copilot for boilerplate**
- Express route structures
- Try-catch blocks
- Import statements

### What Didn't Work:

 **Blindly trusting Copilot suggestions**
- The parameter format issue cost me 40 minutes
- Should have verified against documentation first
- Lesson: AI is a tool, not a replacement for docs

 **Not testing early enough**
- Should have tested after each route, not at the end
- Would have caught the parameter bug sooner
- Lesson: Test-driven development is better

### If I Did This Again:

1. **Read the library documentation FIRST** - before using AI
2. **Test each endpoint immediately** after implementation
3. **Use ChatGPT for algorithms** and complex queries
4. **Use Copilot for boilerplate** only
5. **Implement all business logic manually** to understand it
6. **Write tests alongside features** (didn't do this, should have!)

### Time Breakdown:

| Task | Time | AI % | Manual % |
|------|------|------|----------|
| Planning | 30 min | 0% | 100% |
| Database Schema | 25 min | 20% | 80% |
| Player Routes | 25 min | 25% | 75% |
| Tournament Routes | 40 min | 30% | 70% |
| Game Routes | 45 min | 40% | 60% |
| Leaderboard | 35 min | 50% | 50% |
| Bug Fixing | 40 min | -20%* | 120%* |
| Testing | 15 min | 5% | 95% |
| **Total** | **4h 15m** | **~25%** | **~75%** |

*AI caused the bug, so negative contribution there! 

---

## Conclusion

AI tools were helpful accelerators for standard patterns, SQL queries, and boilerplate code. However, the core problem-solving, architecture decisions, business logic, and debugging were all done manually. The biggest learning was that **AI suggestions need verification** - they can be outdated, wrong, or inappropriate for your specific library version.

The combination allowed me to build faster than pure manual coding, but I maintained full understanding of every line in the codebase. I could explain any part of this system in detail because I thought through the logic myself, even if AI helped with syntax.

**Would I use AI again?** Absolutely - but with more skepticism and documentation-checking.

**Final AI Contribution:** ~25% (mostly boilerplate and SQL)  
**My Contribution:** ~75% (all logic, architecture, and problem-solving)
