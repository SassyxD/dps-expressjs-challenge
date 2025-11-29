import { Router, Request, Response } from 'express';
import db from '../services/db.service';

const router = Router();

// Create a new tournament
router.post('/', (req: Request, res: Response) => {
	try {
		const { name } = req.body;

		if (!name) {
			res.status(400).json({ error: 'Tournament name is required' });
			return;
		}

		const result = db.run('INSERT INTO tournaments (name) VALUES (?)', {
			1: name,
		});

		res.status(201).json({
			id: result.lastInsertRowid,
			name,
			message: 'Tournament created successfully',
		});
	} catch (error) {
		res.status(500).json({ error: 'Failed to create tournament' });
	}
});

// Get tournament by ID
router.get('/:id', (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const tournament = db.query('SELECT * FROM tournaments WHERE id = ?', {
			1: id,
		});

		if (!tournament || tournament.length === 0) {
			res.status(404).json({ error: 'Tournament not found' });
			return;
		}

		res.status(200).json(tournament[0]);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch tournament' });
	}
});

// Add a player to a tournament
router.post('/:id/players', (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { player_id } = req.body;

		if (!player_id) {
			res.status(400).json({ error: 'Player ID is required' });
			return;
		}

		// Check if tournament exists
		const tournament = db.query('SELECT * FROM tournaments WHERE id = ?', {
			1: id,
		});

		if (!tournament || tournament.length === 0) {
			res.status(404).json({ error: 'Tournament not found' });
			return;
		}

		// Check if player exists
		const player = db.query('SELECT * FROM players WHERE id = ?', {
			1: player_id,
		});

		if (!player || player.length === 0) {
			res.status(404).json({ error: 'Player not found' });
			return;
		}

		// Check tournament capacity (max 5 players)
		const participants = db.query(
			'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ?',
			{ 1: id },
		);

		if (participants[0] && (participants[0] as { count: number }).count >= 5) {
			res.status(400).json({ error: 'Tournament is full (max 5 players)' });
			return;
		}

		// Add player to tournament
		db.run(
			'INSERT INTO tournament_participants (tournament_id, player_id) VALUES (?, ?)',
			{ 1: id, 2: player_id },
		);

		res.status(201).json({
			message: 'Player added to tournament successfully',
		});
	} catch (error: unknown) {
		if (error instanceof Error && error.message.includes('UNIQUE')) {
			res.status(400).json({ error: 'Player already in tournament' });
		} else {
			res.status(500).json({ error: 'Failed to add player to tournament' });
		}
	}
});

export default router;
