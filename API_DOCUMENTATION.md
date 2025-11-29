# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Health Check
```
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-29T10:30:00.000Z"
}
```

---

## Players

### Create a Player
```
POST /api/players
```
**Request Body:**
```json
{
  "name": "John Doe"
}
```
**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "John Doe",
  "message": "Player created successfully"
}
```

### Get All Players
```
GET /api/players
```
**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "created_at": "2025-11-29 10:30:00"
  }
]
```

### Get Player by ID
```
GET /api/players/:id
```
**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "John Doe",
  "created_at": "2025-11-29 10:30:00"
}
```

---

## Tournaments

### Create a Tournament
```
POST /api/tournaments
```
**Request Body:**
```json
{
  "name": "Summer Championship 2025"
}
```
**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Summer Championship 2025",
  "message": "Tournament created successfully"
}
```

### Get Tournament by ID
```
GET /api/tournaments/:id
```
**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Summer Championship 2025",
  "created_at": "2025-11-29 10:30:00"
}
```

### Add Player to Tournament
```
POST /api/tournaments/:id/players
```
**Request Body:**
```json
{
  "player_id": 1
}
```
**Response:** `201 Created`
```json
{
  "message": "Player added to tournament successfully"
}
```

**Constraints:**
- Maximum 5 players per tournament
- Player must exist
- Player cannot be added twice to the same tournament

---

## Games

### Record a Game Result
```
POST /api/tournaments/:tournamentId/games
```
**Request Body:**
```json
{
  "player1_id": 1,
  "player2_id": 2,
  "player1_score": 3,
  "player2_score": 1
}
```
**Response:** `201 Created`
```json
{
  "message": "Game result recorded successfully",
  "points_awarded": {
    "player1": 2,
    "player2": 0
  }
}
```

**Point System:**
- Win: 2 points
- Draw: 1 point each
- Loss: 0 points

**Constraints:**
- Both players must be in the tournament
- Players cannot play against themselves
- Each pair can only play once (no rematches)

---

## Leaderboard

### Get Tournament Leaderboard
```
GET /api/tournaments/:id/leaderboard
```
**Response:** `200 OK`
```json
{
  "tournament_id": 1,
  "tournament_name": "Summer Championship 2025",
  "status": "in_progress",
  "participants": 4,
  "games_played": 3,
  "total_games_required": 6,
  "leaderboard": [
    {
      "player_id": 1,
      "player_name": "John Doe",
      "points": 4,
      "games_played": 2
    },
    {
      "player_id": 2,
      "player_name": "Jane Smith",
      "points": 3,
      "games_played": 2
    }
  ]
}
```

**Status Values:**
- `planning`: Tournament has no players or no games played
- `in_progress`: Tournament has started but not all games are played
- `completed`: All required games have been played (round-robin complete)

**Leaderboard Sorting:**
- Primary: Points (descending)
- Secondary: Player name (ascending)

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Tournament is full (max 5 players)"
}
```

### 404 Not Found
```json
{
  "error": "Tournament not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create tournament"
}
```

---

## Usage Example

### Complete Tournament Flow

1. **Create players:**
```bash
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice"}'

curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob"}'

curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{"name": "Charlie"}'
```

2. **Create tournament:**
```bash
curl -X POST http://localhost:3000/api/tournaments \
  -H "Content-Type: application/json" \
  -d '{"name": "Winter Cup"}'
```

3. **Add players to tournament:**
```bash
curl -X POST http://localhost:3000/api/tournaments/1/players \
  -H "Content-Type: application/json" \
  -d '{"player_id": 1}'

curl -X POST http://localhost:3000/api/tournaments/1/players \
  -H "Content-Type: application/json" \
  -d '{"player_id": 2}'

curl -X POST http://localhost:3000/api/tournaments/1/players \
  -H "Content-Type: application/json" \
  -d '{"player_id": 3}'
```

4. **Record game results:**
```bash
# Alice vs Bob (Alice wins 2-0)
curl -X POST http://localhost:3000/api/tournaments/1/games \
  -H "Content-Type: application/json" \
  -d '{"player1_id": 1, "player2_id": 2, "player1_score": 2, "player2_score": 0}'

# Alice vs Charlie (Draw 1-1)
curl -X POST http://localhost:3000/api/tournaments/1/games \
  -H "Content-Type: application/json" \
  -d '{"player1_id": 1, "player2_id": 3, "player1_score": 1, "player2_score": 1}'

# Bob vs Charlie (Bob wins 3-1)
curl -X POST http://localhost:3000/api/tournaments/1/games \
  -H "Content-Type: application/json" \
  -d '{"player1_id": 2, "player2_id": 3, "player1_score": 3, "player2_score": 1}'
```

5. **Check leaderboard:**
```bash
curl http://localhost:3000/api/tournaments/1/leaderboard
```

**Expected Result:**
- Alice: 3 points (1 win + 1 draw)
- Bob: 2 points (1 win)
- Charlie: 1 point (1 draw)
- Status: "completed" (all 3 games played in 3-player round-robin)
