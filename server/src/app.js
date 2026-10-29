import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pool } from './db.js';
import authRotte from './routes/auth/auth.rotte.js';
import profileRotte from './routes/profile/profile.rotte.js';
import ruoliRotte from './routes/ruoli/ruoli.rotte.js';
import bigliettiRotte from './routes/biglietti/biglietti.rotte.js';
import transferRotte from './routes/transfer/transfer.rotte.js';
import alloggiRotte from './routes/alloggi/alloggi.rotte.js';
import { nonTrovato, gestoreErrori } from './middleware/errors.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Massimo 20 tentativi di login ogni 15 minuti per indirizzo IP
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }));

app.get('/api/health', async (req, res) => {
  const { rows } = await pool.query('SELECT NOW() AS ora');
  res.json({ ok: true, ora: rows[0].ora });
});

app.use('/api/auth', authRotte);
app.use('/api/profile', profileRotte);
app.use('/api/ruoli', ruoliRotte);
app.use('/api/biglietti', bigliettiRotte);
app.use('/api/transfer', transferRotte);
app.use('/api/alloggi', alloggiRotte);

app.use('/api', nonTrovato);
app.use(gestoreErrori);