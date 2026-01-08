# Tournament API Test Script
# This script demonstrates the complete workflow of the Round-Robin Tournament Service

Write-Host ""
Write-Host "=== Round-Robin Tournament API Test ===" -ForegroundColor Cyan
Write-Host "Testing server at http://localhost:3000" -ForegroundColor Gray
Write-Host ""

# 1. Health Check
Write-Host "[1] Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
    Write-Host "Server Status: OK" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Server not running!" -ForegroundColor Red
    Write-Host "Please run 'npm run dev' first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2] Creating Players..." -ForegroundColor Yellow
$players = @("Alice", "Bob", "Charlie", "Diana", "Eve")
$playerIds = @()

# First, get existing players
$existingPlayers = Invoke-RestMethod -Uri "http://localhost:3000/api/players" -Method Get
$existingPlayerMap = @{}
foreach ($ep in $existingPlayers) {
    $existingPlayerMap[$ep.name] = $ep.id
}

foreach ($name in $players) {
    if ($existingPlayerMap.ContainsKey($name)) {
        $playerId = $existingPlayerMap[$name]
        $playerIds += $playerId
        Write-Host "Using existing player: $name (ID: $playerId)" -ForegroundColor Cyan
    } else {
        $body = "{`"name`":`"$name`"}"
        try {
            $player = Invoke-RestMethod -Uri "http://localhost:3000/api/players" -Method Post -Body $body -ContentType "application/json"
            $playerIds += $player.id
            Write-Host "Created player: $name (ID: $($player.id))" -ForegroundColor Green
        } catch {
            Write-Host "Could not create player: $name" -ForegroundColor Red
        }
    }
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "[3] Creating Tournament..." -ForegroundColor Yellow
$tournamentBody = "{`"name`":`"Championship 2026`"}"
$tournament = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method Post -Body $tournamentBody -ContentType "application/json"
Write-Host "Created tournament: $($tournament.name) (ID: $($tournament.id))" -ForegroundColor Green
$tournamentId = $tournament.id

Write-Host ""
Write-Host "[4] Adding Players to Tournament..." -ForegroundColor Yellow
foreach ($playerId in $playerIds) {
    if ($playerId) {
        $body = "{`"player_id`":$playerId}"
        try {
            $null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/players" -Method Post -Body $body -ContentType "application/json"
            Write-Host "Added player ID $playerId to tournament" -ForegroundColor Green
        } catch {
            Write-Host "Could not add player ID $playerId (may already be in tournament)" -ForegroundColor Yellow
        }
        Start-Sleep -Milliseconds 100
    }
}

Write-Host ""
Write-Host "[5] Checking Initial Leaderboard..." -ForegroundColor Yellow
$leaderboard = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/leaderboard" -Method Get
Write-Host "Status: $($leaderboard.status)" -ForegroundColor Cyan
Write-Host "Games Played: $($leaderboard.games_played) / $($leaderboard.total_games_required)" -ForegroundColor Cyan

Write-Host ""
Write-Host "[6] Recording Game Results..." -ForegroundColor Yellow

# Play only 4 games to demonstrate in_progress status (need 10 games for 5 players)
if ($playerIds.Count -ge 4) {
    # Game 1: Alice vs Bob (Alice wins 3-1)
    $game1Body = @{
        player1_id = $playerIds[0]
        player2_id = $playerIds[1]
        player1_score = 3
        player2_score = 1
    } | ConvertTo-Json
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/games" -Method Post -Body $game1Body -ContentType "application/json"
        Write-Host "Game 1: Alice 3-1 Bob (Alice wins)" -ForegroundColor Green
    } catch {
        Write-Host "Could not record Game 1 (may already exist)" -ForegroundColor Yellow
    }

    # Game 2: Charlie vs Diana (Draw 2-2)
    $game2Body = @{
        player1_id = $playerIds[2]
        player2_id = $playerIds[3]
        player1_score = 2
        player2_score = 2
    } | ConvertTo-Json
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/games" -Method Post -Body $game2Body -ContentType "application/json"
        Write-Host "Game 2: Charlie 2-2 Diana (Draw)" -ForegroundColor Green
    } catch {
        Write-Host "Could not record Game 2 (may already exist)" -ForegroundColor Yellow
    }

    # Game 3: Eve vs Alice (Alice wins 2-0)
    if ($playerIds.Count -ge 5) {
        $game3Body = @{
            player1_id = $playerIds[4]
            player2_id = $playerIds[0]
            player1_score = 0
            player2_score = 2
        } | ConvertTo-Json
        try {
            $null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/games" -Method Post -Body $game3Body -ContentType "application/json"
            Write-Host "Game 3: Eve 0-2 Alice (Alice wins)" -ForegroundColor Green
        } catch {
            Write-Host "Could not record Game 3 (may already exist)" -ForegroundColor Yellow
        }
    }

    # Game 4: Bob vs Charlie (Charlie wins 3-2)
    $game4Body = @{
        player1_id = $playerIds[1]
        player2_id = $playerIds[2]
        player1_score = 2
        player2_score = 3
    } | ConvertTo-Json
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/games" -Method Post -Body $game4Body -ContentType "application/json"
        Write-Host "Game 4: Bob 2-3 Charlie (Charlie wins)" -ForegroundColor Green
    } catch {
        Write-Host "Could not record Game 4 (may already exist)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "[7] Final Leaderboard..." -ForegroundColor Yellow
$finalLeaderboard = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/leaderboard" -Method Get

Write-Host ""
Write-Host "Tournament: $($finalLeaderboard.tournament_name)" -ForegroundColor Cyan
Write-Host "Status: $($finalLeaderboard.status)" -ForegroundColor Cyan
Write-Host "Games: $($finalLeaderboard.games_played) / $($finalLeaderboard.total_games_required)" -ForegroundColor Cyan
Write-Host ""
Write-Host "LEADERBOARD:" -ForegroundColor White
Write-Host "------------" -ForegroundColor White

$rank = 1
foreach ($entry in $finalLeaderboard.leaderboard) {
    $gamesCount = $entry.games_played
    Write-Host "$rank. $($entry.player_name) - $($entry.points) points ($gamesCount games)" -ForegroundColor White
    $rank++
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
Write-Host "Server is still running at http://localhost:3000" -ForegroundColor Gray
Write-Host ""
