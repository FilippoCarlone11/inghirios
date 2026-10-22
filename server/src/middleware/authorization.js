import { ErroreHttp } from './errors.js';

export function richiediRuolo(...ruoli) {
  return (req, res, next) => {
    if (!ruoli.includes(req.utente.ruolo)) {
      throw new ErroreHttp(403, 'Non hai i permessi per questa operazione');
    }
    next();
  };
}