import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS ora');
    res.json({ ok: true, ora: rows[0].ora });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`inghirios server su http://localhost:${process.env.PORT}`);
});