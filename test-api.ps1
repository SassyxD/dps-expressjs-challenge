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

foreach ($name in $players) {
    $body = "{`"name`":`"$name`"}"
    $player = Invoke-RestMethod -Uri "http://localhost:3000/api/players" -Method Post -Body $body -ContentType "application/json"
    $playerIds += $player.id
    Write-Host "Created player: $name (ID: $($player.id))" -ForegroundColor Green
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "[3] Creating Tournament..." -ForegroundColor Yellow
$tournamentBody = "{`"name`":`"Championship 2025`"}"
$tournament = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments" -Method Post -Body $tournamentBody -ContentType "application/json"
Write-Host "Created tournament: $($tournament.name) (ID: $($tournament.id))" -ForegroundColor Green
$tournamentId = $tournament.id

Write-Host ""
Write-Host "[4] Adding Players to Tournament..." -ForegroundColor Yellow
foreach ($playerId in $playerIds) {
    $body = "{`"player_id`":$playerId}"
    $null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/players" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Added player ID $playerId to tournament" -ForegroundColor Green
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "[5] Checking Initial Leaderboard..." -ForegroundColor Yellow
$leaderboard = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/leaderboard" -Method Get
Write-Host "Status: $($leaderboard.status)" -ForegroundColor Cyan
Write-Host "Games Played: $($leaderboard.games_played) / $($leaderboard.total_games_required)" -ForegroundColor Cyan

Write-Host ""
Write-Host "[6] Recording Game Results..." -ForegroundColor Yellow

# Game 1: Alice vs Bob (Alice wins 3-1)
$game1 = "{`"player1_id`":$($playerIds[0]),`"player2_id`":$($playerIds[1]),`"player1_score`":3,`"player2_score`":1}"
$null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/games" -Method Post -Body $game1 -ContentType "application/json"
Write-Host "Game 1: Alice 3-1 Bob (Alice wins)" -ForegroundColor Green

# Game 2: Charlie vs Diana (Draw 2-2)
$game2 = "{`"player1_id`":$($playerIds[2]),`"player2_id`":$($playerIds[3]),`"player1_score`":2,`"player2_score`":2}"
$null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/games" -Method Post -Body $game2 -ContentType "application/json"
Write-Host "Game 2: Charlie 2-2 Diana (Draw)" -ForegroundColor Green

# Game 3: Eve vs Alice (Alice wins 2-0)
$game3 = "{`"player1_id`":$($playerIds[4]),`"player2_id`":$($playerIds[0]),`"player1_score`":0,`"player2_score`":2}"
$null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/games" -Method Post -Body $game3 -ContentType "application/json"
Write-Host "Game 3: Eve 0-2 Alice (Alice wins)" -ForegroundColor Green

# Game 4: Bob vs Charlie (Charlie wins 3-2)
$game4 = "{`"player1_id`":$($playerIds[1]),`"player2_id`":$($playerIds[2]),`"player1_score`":2,`"player2_score`":3}"
$null = Invoke-RestMethod -Uri "http://localhost:3000/api/tournaments/$tournamentId/games" -Method Post -Body $game4 -ContentType "application/json"
Write-Host "Game 4: Bob 2-3 Charlie (Charlie wins)" -ForegroundColor Green

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
    Write-Host "$rank. $($entry.player_name) - $($entry.points) points ($($entry.games_played) games)" -ForegroundColor White
    $rank++
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Green
Write-Host "Server is still running at http://localhost:3000" -ForegroundColor Gray
Write-Host ""
