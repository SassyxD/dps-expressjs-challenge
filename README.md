# DPS Backend Coding Challenge

## Overview: Round-Robin Tournament Service

Your task is to build a backend service to manage round-robin sports tournaments. In a round-robin tournament, each participant must play against every other participant exactly once.

Constraints and rules:
- Each tournament can have up to 5 participants.
- A game result gives:
    - **2 points** for a win
    - **1 point** for a draw
    - **0 points** for a loss
- A tournament is considered completed when everybody has played against everybody.
- The service must be able to return a **leaderboard** for a given tournament, including its **status**.

## Challenge Tasks

-   **Fork this project:** You can either fork this repository or create a new one, using tech stack of your choice, and database, but your solution must be easy to run locally and clearly documented. 
       1. If you're using this template, you can use ([db.service.ts](./src/services/db.service.ts)) to handle SQL queries to the database. 
       2. Don't create PRs to this repository, provide a separate repo. 
-   **REST API Development:** Design and implement a RESTful APIs to create tournaments, create players and add them to the tournaments and to enter game results.
-   **Special API Endpoint:** Implement an endpoint that returns the status of a given tournament (in planning, started, finished) and the leaderboard (list of all participants of the tournament, their points up to date sorted descendingly).
-   **Submission:** After completing the challenge, email us the URL of your GitHub repository.
-   **Further information:**
    -   If there is anything unclear regarding requirements, contact us by replying to our email.
    -   Use small commits, we want to see your progress towards the solution.
    -   Code clean and follow the best practices.

## Environment Setup

If you are using suggested template. Ensure you have Node.js (v14.x or later) and npm (v6.x or later) installed. To set up and run the application, execute the following commands:

```
npm install
npm run dev
```

The application will then be accessible at http://localhost:3000.

## Solution Implementation

### ✅ Completed Features

This solution implements all required functionality:

1. **Database Schema** - SQLite database with 4 tables:
   - `tournaments` - Tournament information
   - `players` - Player registry
   - `tournament_participants` - Junction table linking players to tournaments
   - `games` - Game results and scores

2. **REST API Endpoints**:
   - `POST /api/players` - Create a new player
   - `GET /api/players` - List all players
   - `GET /api/players/:id` - Get player details
   - `POST /api/tournaments` - Create a new tournament
   - `GET /api/tournaments/:id` - Get tournament details
   - `POST /api/tournaments/:id/players` - Add player to tournament (max 5)
   - `POST /api/tournaments/:id/games` - Record game result
   - `GET /api/tournaments/:id/leaderboard` - Get leaderboard with status

3. **Tournament Status Logic**:
   - `planning` - No players or no games played yet
   - `in_progress` - Tournament started but not all games completed
   - `completed` - All round-robin games finished

4. **Point System**:
   - Win: 2 points
   - Draw: 1 point each
   - Loss: 0 points

### 📚 Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[AI_USAGE.md](./AI_USAGE.md)** - AI assistance transparency log

### 🧪 Testing

You can test the API using curl, Postman, or any HTTP client. See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete usage examples.

Quick test:
```bash
# Health check
curl http://localhost:3000/health

# Create a player
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice"}'
```

### 🏗️ Architecture

- **TypeScript** for type safety
- **Express.js** for REST API
- **SQLite** with better-sqlite3 for data persistence
- **Conventional commits** for clear git history
- **Modular route structure** for maintainability

## AI Usage Rules

You are allowed to use AI tools to complete this task. However, **transparency is required**.
Please include a small artifact folder or a markdown section with:
- Links to ChatGPT / Claude / Copilot conversations
- Any prompts used (copy/paste the prompt text if links are private)
- Notes about what parts were AI-assisted
- Any generated code snippets you modified or rejected

This helps us understand your workflow and decision-making process, not to judge AI usage.

Happy coding!
