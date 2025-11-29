import express, { Express } from 'express';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init';
import tournamentsRouter from './routes/tournaments';
import playersRouter from './routes/players';
import gamesRouter from './routes/games';
import leaderboardRouter from './routes/leaderboard';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'ok',
		timestamp: new Date().toISOString(),
	});
});

// API routes
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/tournaments', gamesRouter);
app.use('/api/tournaments', leaderboardRouter);
app.use('/api/players', playersRouter);

app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`);
});
