import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { richiediAuth } from '../../middleware/authentication.js';
import { richiediRuolo } from '../../middleware/authorization.js';
import { ErroreHttp } from '../../middleware/errors.js';
import { RUOLI, ELENCO_RUOLI } from '../../ruoli.js';
import { elenco, crea } from './profile.query.js';

const router = Router();

router.get('/', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  res.json(await elenco());
});

router.post('/', richiediAuth, richiediRuolo(RUOLI.ADMIN), async (req, res) => {
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const nome = String(req.body?.nome ?? '').trim();
  const cognome = String(req.body?.cognome ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase() || null;
  const telefono = String(req.body?.telefono ?? '').trim() || null;
  const ruolo = String(req.body?.ruolo ?? '');
  const password = String(req.body?.password ?? '');

  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    throw new ErroreHttp(
      400,
      'Lo username deve avere da 3 a 50 caratteri: lettere, numeri, punto, trattino o underscore'
    );
  }
  if (!nome || !cognome) throw new ErroreHttp(400, 'Nome e cognome sono obbligatori');
  if (!ELENCO_RUOLI.includes(ruolo)) throw new ErroreHttp(400, 'Ruolo non valido');
  if (password.length < 8) throw new ErroreHttp(400, 'La password deve avere almeno 8 caratteri');
  if (email && !email.includes('@')) throw new ErroreHttp(400, 'Email non valida');

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const persona = await crea({ username, passwordHash, nome, cognome, email, telefono, ruolo });
    res.status(201).json(persona);
  } catch (err) {
    // 23505 = violazione di un vincolo UNIQUE (username o email già esistenti)
    if (err.code === '23505') {
      const campo = err.constraint?.includes('email') ? 'email' : 'username';
      throw new ErroreHttp(409, `Esiste già una persona con questo ${campo}`);
    }
    throw err;
  }
});

export default router;