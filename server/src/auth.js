import jwt from 'jsonwebtoken'
import { pool } from './db.js'

export async function richiediAuth(req, res, next){
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');

    if(tipo !== 'Bearer' || !token){
        return res.status(401).json({errore: 'Non sei autenticato'})
    }

    let payload;

    try{
        payload = jwt.verify(token, process.env.JWT_SECRET);
    }catch{
        return res.status(401).json({ errore : 'Sessione scaduta o non valida'})
    }


    const { rows } = await pool.query(
        `SELECT id, username, nome, cognome, ruolo
        FROM persone WHERE id = $1 AND attivo = true`,
        [Number(payload.sub)]
    );
    if (rows.length === 0) {
        return res.status(401).json({ errore: 'Utente non valido' });
    }

    req.utente = rows[0];
    next();

}

export function richiediRuolo(...ruoli) {
  return (req, res, next) => {
    if (!ruoli.includes(req.utente.ruolo)) {
      return res.status(403).json({ errore: 'Non hai i permessi per questa operazione' });
    }
    next();
  };
}