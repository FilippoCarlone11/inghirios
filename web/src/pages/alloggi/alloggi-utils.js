export const euro = (n) => `€${Number(n || 0).toFixed(2)}`;

export function aISO(valore) {
  if (!valore) return '';
  const d = new Date(valore);
  if (isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function formattaData(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function giorniTra(isoA, isoB) {
  return (Date.parse(isoB) - Date.parse(isoA)) / 86400000;
}

export function costruisciSoggiorni(idCamera, occupazioni) {
  const righe = occupazioni.filter((o) => o.id_camera === idCamera);
  const soggiorni = [];
  const raggruppamento = {};
  
  righe.forEach((r) => {
    const chiave = r.id_persona ? `p_${r.id_persona}` : `a_${r.id_accompagnatore}`;
    if (!raggruppamento[chiave]) raggruppamento[chiave] = [];
    raggruppamento[chiave].push(r);
  });

  Object.values(raggruppamento).forEach((lista) => {
    const ordinate = [...lista].filter((r) => aISO(r.data) !== '').sort((a, b) => aISO(a.data).localeCompare(aISO(b.data)));
    let corrente = null;
    ordinate.forEach((r) => {
      const giorno = aISO(r.data);
      if (corrente && giorniTra(corrente.fine, giorno) <= 1) {
        corrente.fine = giorno;
        corrente.nottiIndividuali.push(r);
      } else {
        corrente = {
          id_persona: r.id_persona || null,
          id_accompagnatore: r.id_accompagnatore || null,
          chiaveUnica: r.id_persona ? `p_${r.id_persona}` : `a_${r.id_accompagnatore}`,
          nome: `${r.nome_persona} ${r.cognome_persona}`,
          inizio: giorno,
          fine: giorno,
          nottiIndividuali: [r]
        };
        soggiorni.push(corrente);
      }
    });
  });

  return soggiorni.sort((a, b) => a.inizio.localeCompare(b.inizio));
}

export const stilePericolo = { backgroundColor: 'transparent', color: '#b42318', border: '1px solid #b42318', cursor: 'pointer' };
export const stileBottonePiccolo = { padding: '0.35rem 0.75rem', fontSize: '0.9rem', cursor: 'pointer' };