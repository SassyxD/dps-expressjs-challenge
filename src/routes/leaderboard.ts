import { Router, Request, Response } from 'express';
import db from '../services/db.service';

const router = Router();

// Get tournament leaderboard with status
router.get('/:id/leaderboard', (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		// Check if tournament exists
		const tournament = db.query('SELECT * FROM tournaments WHERE id = ?', [
			id,
		]);

		if (!tournament || tournament.length === 0) {
			res.status(404).json({ error: 'Tournament not found' });
			return;
		}

		// Get participants count
		const participantsResult = db.query(
			'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ?',
			[id],
		);

		const participantCount = (participantsResult[0] as { count: number })
			.count;

		// Get total games played
		const gamesResult = db.query(
			'SELECT COUNT(*) as count FROM games WHERE tournament_id = ?',
			[id],
		);

		const gamesPlayed = (gamesResult[0] as { count: number }).count;

		// Calculate total required games (n * (n-1) / 2 for round-robin)
		const totalRequiredGames =
			(participantCount * (participantCount - 1)) / 2;

		// Determine status
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

		// Get leaderboard
		const leaderboard = db.query(
			`SELECT 
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
			ORDER BY tp.points DESC, p.name ASC`,
			[id],
		);

		res.status(200).json({
			tournament_id: id,
			tournament_name: (tournament[0] as { name: string }).name,
			status,
			participants: participantCount,
			games_played: gamesPlayed,
			total_games_required: totalRequiredGames,
			leaderboard,
		});
	} catch (error) {
		console.error('Error fetching leaderboard:', error);
		res.status(500).json({ error: 'Failed to fetch leaderboard' });
	}
});

export default router;
