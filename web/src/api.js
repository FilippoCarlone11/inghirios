const CHIAVE_TOKEN = 'inghirios_token';

export const leggiToken = () => localStorage.getItem(CHIAVE_TOKEN);
export const salvaToken = (token) => localStorage.setItem(CHIAVE_TOKEN, token);
export const rimuoviToken = () => localStorage.removeItem(CHIAVE_TOKEN);

export async function api(percorso, { metodo = 'GET', corpo } = {}) {
  const intestazioni = { 'Content-Type': 'application/json' };
  const token = leggiToken();
  if (token) intestazioni.Authorization = `Bearer ${token}`;

  const risposta = await fetch(`/api${percorso}`, {
    method: metodo,
    headers: intestazioni,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  const dati = await risposta.json().catch(() => null);
  if (!risposta.ok) {
    const errore = new Error(dati?.errore ?? 'Errore di rete');
    errore.stato = risposta.status;
    throw errore;
  }
  return dati;
}