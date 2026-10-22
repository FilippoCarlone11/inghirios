import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pool } from './db.js';
import authRouter from './routes/auth.js';
import { richiediAuth, richiediRuolo } from './auth.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }));


app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS ora');
    res.json({ ok: true, ora: rows[0].ora });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.use('/api/auth', authRouter);

app.get('/api/persone', richiediAuth, richiediRuolo('admin'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, username, nome, cognome, email, telefono, ruolo, attivo
     FROM persone ORDER BY cognome, nome`
  );
  res.json(rows);
});

app.listen(process.env.PORT, () => {
  console.log(`inghirios server su http://localhost:${process.env.PORT}`);
});