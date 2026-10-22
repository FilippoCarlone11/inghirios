import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { ErroreHttp } from './errors.js';
import { trovaAttivaPerId } from '../routes/profile/profile.query.js';

export async function richiediAuth(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    throw new ErroreHttp(401, 'Non autenticato');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new ErroreHttp(401, 'Sessione scaduta o non valida');
  }

  const persona = await trovaAttivaPerId(Number(payload.sub));
  if (!persona) {
    throw new ErroreHttp(401, 'Utente non valido');
  }

  req.utente = persona;
  next();
}