import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config.js';
import { richiediAuth } from '../../middleware/authentication.js';
import { ErroreHttp } from '../../middleware/errors.js';
import { trovaPerUsername, hashPasswordDi, aggiornaPassword } from '../profile/profile.query.js';

const router = Router();

router.post('/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  const persona = await trovaPerUsername(username);
  const valida =
    persona && persona.attivo && (await bcrypt.compare(password, persona.password_hash));
  if (!valida) {
    throw new ErroreHttp(401, 'Credenziali non valide');
  }

  const token = jwt.sign({ sub: String(persona.id) }, config.jwtSecret, { expiresIn: '12h' });

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
    throw new ErroreHttp(400, 'La nuova password deve avere almeno 8 caratteri');
  }

  const hashAttuale = await hashPasswordDi(req.utente.id);
  if (!(await bcrypt.compare(attuale, hashAttuale))) {
    throw new ErroreHttp(401, 'La password attuale non è corretta');
  }

  await aggiornaPassword(req.utente.id, await bcrypt.hash(nuova, 12));
  res.json({ ok: true });
});

export default router;