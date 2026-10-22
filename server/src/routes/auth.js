import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { richiediAuth } from '../auth.js';


const router = Router();

router.post('/login', async(req, res) => {
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    const { rows } = await pool.query(
        `SELECT id, username, nome, cognome, ruolo, password_hash, attivo
            FROM persone WHERE username = $1`,
    [username]
    );

    const persona = rows[0];
    const valid_login = persona && persona.attivo && (await bcrypt.compare(password, persona.password_hash));

    if (!valid_login)
        return res.status(401).json({errore: 'Credenziali non valide'});

    const token =jwt.sign({sub: String(persona.id)}, process.env.JWT_SECRET, {expiresIn: '12h'});


    res.json({
        token,
        utente: {
            id: persona.id,
            username: persona.username,
            nome: persona.nome,
            cognome: persona.cognome,
            ruolo: persona.ruolo,
        },


    });
    
});

router.get('/me', richiediAuth, (req, res) => {
  res.json(req.utente);
});

router.post('/cambia-password', richiediAuth, async (req, res) => {
  const attuale = String(req.body?.passwordAttuale ?? '');
  const nuova = String(req.body?.nuovaPassword ?? '');

  if (nuova.length < 8) {
    return res.status(400).json({ errore: 'La nuova password deve avere almeno 8 caratteri' });
  }

  const { rows } = await pool.query('SELECT password_hash FROM persone WHERE id = $1', [
    req.utente.id,
  ]);
  if (!(await bcrypt.compare(attuale, rows[0].password_hash))) {
    return res.status(401).json({ errore: 'La password attuale non è corretta' });
  }

  const hash = await bcrypt.hash(nuova, 12);
  await pool.query('UPDATE persone SET password_hash = $1 WHERE id = $2', [hash, req.utente.id]);
  res.json({ ok: true });
});

export default router;