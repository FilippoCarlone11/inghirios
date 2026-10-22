export class ErroreHttp extends Error {
  constructor(stato, messaggio) {
    super(messaggio);
    this.stato = stato;
  }
}

export function nonTrovato(req, res) {
  res.status(404).json({ errore: 'Risorsa non trovata' });
}

// Per essere riconosciuta da Express la funzione deve avere 4 parametri
// eslint-disable-next-line no-unused-vars
export function gestoreErrori(err, req, res, next) {
  if (err instanceof ErroreHttp) {
    return res.status(err.stato).json({ errore: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ errore: 'Il corpo della richiesta non è un JSON valido' });
  }
  console.error(err); // il dettaglio resta nel log del server
  res.status(500).json({ errore: 'Errore interno del server' });
}