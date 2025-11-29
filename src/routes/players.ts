import { Router, Request, Response } from 'express';
import db from '../services/db.service';

const router = Router();

// Create a new player
router.post('/', (req: Request, res: Response) => {
	try {
		const { name } = req.body;

		if (!name) {
			res.status(400).json({ error: 'Player name is required' });
			return;
		}

		const result = db.run('INSERT INTO players (name) VALUES (?)', { 1: name });

		res.status(201).json({
			id: result.lastInsertRowid,
			name,
			message: 'Player created successfully',
		});
	} catch (error: unknown) {
		if (error instanceof Error && error.message.includes('UNIQUE')) {
			res.status(400).json({ error: 'Player name already exists' });
		} else {
			res.status(500).json({ error: 'Failed to create player' });
		}
	}
});

// Get all players
router.get('/', (req: Request, res: Response) => {
	try {
		const players = db.query('SELECT * FROM players');
		res.status(200).json(players);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch players' });
	}
});

// Get player by ID
router.get('/:id', (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const player = db.query('SELECT * FROM players WHERE id = ?', { 1: id });

		if (!player || player.length === 0) {
			res.status(404).json({ error: 'Player not found' });
			return;
		}

		res.status(200).json(player[0]);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch player' });
	}
});

export default router;
