import { Router, Request, Response } from 'express';
import db from '../services/db.service';

const router = Router();

// Record a game result
router.post('/:tournamentId/games', (req: Request, res: Response) => {
	try {
		const { tournamentId } = req.params;
		const { player1_id, player2_id, player1_score, player2_score } =
			req.body;

		// Validation
		if (
			!player1_id ||
			!player2_id ||
			player1_score === undefined ||
			player2_score === undefined
		) {
			res.status(400).json({
				error: 'All fields are required: player1_id, player2_id, player1_score, player2_score',
			});
			return;
		}

		if (player1_id === player2_id) {
			res.status(400).json({
				error: 'A player cannot play against themselves',
			});
			return;
		}

		// Check if both players are in the tournament
		const participant1 = db.query(
			'SELECT * FROM tournament_participants WHERE tournament_id = ? AND player_id = ?',
			[tournamentId, player1_id],
		);

		const participant2 = db.query(
			'SELECT * FROM tournament_participants WHERE tournament_id = ? AND player_id = ?',
			[tournamentId, player2_id],
		);

		if (!participant1 || participant1.length === 0) {
			res.status(400).json({
				error: 'Player 1 is not in this tournament',
			});
			return;
		}

		if (!participant2 || participant2.length === 0) {
			res.status(400).json({
				error: 'Player 2 is not in this tournament',
			});
			return;
		}

		// Check if game already exists (in either direction)
		const existingGame = db.query(
			`SELECT * FROM games 
			WHERE tournament_id = ? 
			AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))`,
			[tournamentId, player1_id, player2_id, player2_id, player1_id],
		);

		if (existingGame && existingGame.length > 0) {
			res.status(400).json({
				error: 'Game between these players already recorded',
			});
			return;
		}

		// Record the game
		db.run(
			'INSERT INTO games (tournament_id, player1_id, player2_id, player1_score, player2_score) VALUES (?, ?, ?, ?, ?)',
			[
				tournamentId,
				player1_id,
				player2_id,
				player1_score,
				player2_score,
			],
		);

		// Calculate points: Win = 2, Draw = 1, Loss = 0
		let player1Points = 0;
		let player2Points = 0;

		if (player1_score > player2_score) {
			player1Points = 2;
			player2Points = 0;
		} else if (player1_score < player2_score) {
			player1Points = 0;
			player2Points = 2;
		} else {
			player1Points = 1;
			player2Points = 1;
		}

		// Update player points
		db.run(
			'UPDATE tournament_participants SET points = points + ? WHERE tournament_id = ? AND player_id = ?',
			[player1Points, tournamentId, player1_id],
		);

		db.run(
			'UPDATE tournament_participants SET points = points + ? WHERE tournament_id = ? AND player_id = ?',
			[player2Points, tournamentId, player2_id],
		);

		res.status(201).json({
			message: 'Game result recorded successfully',
			points_awarded: {
				player1: player1Points,
				player2: player2Points,
			},
		});
	} catch (error) {
		console.error('Error recording game:', error);
		res.status(500).json({ error: 'Failed to record game result' });
	}
});

export default router;
