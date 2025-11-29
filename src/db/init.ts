import db from '../services/db.service';

export function initializeDatabase() {
	// Create tournaments table
	db.run(`
		CREATE TABLE IF NOT EXISTS tournaments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Create players table
	db.run(`
		CREATE TABLE IF NOT EXISTS players (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Create tournament_participants table (junction table)
	db.run(`
		CREATE TABLE IF NOT EXISTS tournament_participants (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tournament_id INTEGER NOT NULL,
			player_id INTEGER NOT NULL,
			points INTEGER DEFAULT 0,
			FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
			FOREIGN KEY (player_id) REFERENCES players(id),
			UNIQUE(tournament_id, player_id)
		)
	`);

	// Create games table
	db.run(`
		CREATE TABLE IF NOT EXISTS games (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tournament_id INTEGER NOT NULL,
			player1_id INTEGER NOT NULL,
			player2_id INTEGER NOT NULL,
			player1_score INTEGER NOT NULL,
			player2_score INTEGER NOT NULL,
			played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
			FOREIGN KEY (player1_id) REFERENCES players(id),
			FOREIGN KEY (player2_id) REFERENCES players(id),
			UNIQUE(tournament_id, player1_id, player2_id)
		)
	`);

	console.log('Database initialized successfully');
}
