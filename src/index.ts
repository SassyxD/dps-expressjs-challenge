import express, { Express } from 'express';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/init';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

app.use(express.json());

app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'ok',
		timestamp: new Date().toISOString(),
	});
});

app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`);
});
