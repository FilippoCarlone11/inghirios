import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';

export default function Profilo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [datiProfilo, setDatiProfilo] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    setCaricamento(true);
    api(`/profile/${id}`)
      .then((dati) => {
        setDatiProfilo(dati);
      })
      .catch((err) => {
        setErrore(err.message);
      })
      .finally(() => {
        setCaricamento(false);
      });
  }, [id]);

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento profilo in corso...</p>;
  if (errore) return <p style={{ padding: '2rem', color: '#ef4444' }}>Errore: {errore}</p>;
  if (!datiProfilo || !datiProfilo.datiPersonali) return <p style={{ padding: '2rem' }}>Profilo non trovato.</p>;

  const { 
    datiPersonali, 
    datiGiurato, 
    membriGruppo, 
    accompagnatori, 
    alloggio, 
    biglietti 
  } = datiProfilo;

  // LOGICA DI RAGGRUPPAMENTO NOTTI (crea soggiorni continui da notti singole)
  const raggruppaAlloggi = (notti) => {
    if (!notti || notti.length === 0) return [];
    
    const soggiorni = [];
    let soggiornoAttuale = null;

    notti.forEach((notte) => {
      // Impostiamo l'orario a mezzogiorno per evitare problemi di fuso orario/ora legale
      const dataNotte = new Date(notte.data + 'T12:00:00Z');
      
      if (!soggiornoAttuale) {
        soggiornoAttuale = {
          ...notte,
          data_inizio: dataNotte,
          // Il check-out è il giorno successivo alla notte prenotata
          data_fine: new Date(dataNotte.getTime() + 86400000) 
        };
      } else {
        const isStessaCamera = soggiornoAttuale.id_camera === notte.id_camera;
        // Controlla se la data della notte è esattamente uguale alla data di check-out del soggiorno attuale (notti consecutive)
        const isGiornoDopo = dataNotte.toDateString() === soggiornoAttuale.data_fine.toDateString();

        if (isStessaCamera && isGiornoDopo) {
          // Estendi il check-out del soggiorno attuale di un ulteriore giorno
          soggiornoAttuale.data_fine = new Date(dataNotte.getTime() + 86400000);
        } else {
          soggiorni.push(soggiornoAttuale);
          soggiornoAttuale = {
            ...notte,
            data_inizio: dataNotte,
            data_fine: new Date(dataNotte.getTime() + 86400000)
          };
        }
      }
    });

    if (soggiornoAttuale) {
      soggiorni.push(soggiornoAttuale);
    }

    return soggiorni;
  };

  const soggiorniRaggruppati = raggruppaAlloggi(alloggio);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Profilo Utente</h1>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          ← Torna indietro
        </button>
      </div>

      {/* SEZIONE DATI PERSONALI */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: 'var(--primary)' }}>
          Dati Principali
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          <div><strong>Nome e Cognome:</strong> <br/>{datiPersonali.nome} {datiPersonali.cognome}</div>
          <div><strong>Username:</strong> <br/>{datiPersonali.username}</div>
          <div><strong>Email:</strong> <br/>{datiPersonali.email || '-'}</div>
          <div><strong>Telefono:</strong> <br/>{datiPersonali.telefono || '-'}</div>
          <div>
            <strong>Ruolo:</strong> <br/>
            <span className="badge">{datiPersonali.ruolo.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* SEZIONE DETTAGLI GIURATO */}
      {datiGiurato && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: '#3b82f6' }}>
            Dettagli Giuria
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {/* Doppio controllo (tipo_giuria o tipo_giudice) per prendere il campo corretto dal DB */}
            <div><strong>Tipo Giuria:</strong> <br/>{datiGiurato.tipo_giuria || datiGiurato.tipo_giudice || '-'}</div>
            <div><strong>Partecipazione:</strong> <br/>{datiGiurato.partecipazione || datiGiurato.tipo_partecipazione || '-'}</div>
            <div><strong>Emittente:</strong> <br/>{datiGiurato.emittente || '-'}</div>
            <div><strong>Mezzo Info:</strong> <br/>{datiGiurato.mezzo_di_informazione || '-'}</div>
            <div><strong>Liberatoria:</strong> <br/>{datiGiurato.liberatoria_consegnata ? '✅ Consegnata' : '❌ Non consegnata'}</div>
            <div><strong>In Edizione:</strong> <br/>{datiGiurato.partecipa_in_questa_edizione ? '✅ Sì' : '❌ No'}</div>
          </div>
        </div>
      )}

      {/* SEZIONE MEMBRI DEL GRUPPO (solo per Ospiti con gruppo) */}
      {membriGruppo && membriGruppo.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: 'var(--primary)' }}>
            Membri del Gruppo (Senza account)
          </h3>
          <ul style={{ listStyleType: 'none', padding: 0, margin: '1rem 0 0 0' }}>
            {membriGruppo.map((membro, index) => (
              <li key={index} style={{ padding: '0.5rem 0', borderBottom: '1px dashed var(--border)' }}>
                👤 {membro.nome} {membro.cognome}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SEZIONE ACCOMPAGNATORI */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: 'var(--primary)' }}>
          Accompagnatori
        </h3>
        {!accompagnatori || accompagnatori.length === 0 ? (
          <p style={{ marginTop: '1rem', fontStyle: 'italic', color: '#64748b' }}>Nessun accompagnatore associato.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0, margin: '1rem 0 0 0' }}>
            {accompagnatori.map((acc, index) => (
              <li key={index} style={{ padding: '0.5rem 0', borderBottom: '1px dashed var(--border)' }}>
                👥 {acc.nome_accompagnatore || acc.nome} {acc.cognome_accompagnatore || acc.cognome}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SEZIONE ALLOGGIO RAGGRUPPATO */}
      {soggiorniRaggruppati.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: '#10b981' }}>
            Pernottamenti (Alloggio)
          </h3>
          <div className="table-container" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Struttura</th>
                  <th>Camera</th>
                  <th>Soggiorno (Arrivo - Partenza)</th>
                </tr>
              </thead>
              <tbody>
                {soggiorniRaggruppati.map((soggiorno, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{soggiorno.nome_alloggio}</strong><br/>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{soggiorno.indirizzo}</span>
                    </td>
                    <td>Cam. {soggiorno.id_camera} ({soggiorno.posti_letto} posti)</td>
                    <td>
                      <strong>Dal:</strong> {soggiorno.data_inizio.toLocaleDateString('it-IT')}<br/>
                      <strong>Al:</strong> {soggiorno.data_fine.toLocaleDateString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEZIONE BIGLIETTI */}
      {biglietti && biglietti.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginTop: 0, color: '#f59e0b' }}>
            Biglietti ed Eventi
          </h3>
          <ul style={{ listStyleType: 'none', padding: 0, margin: '1rem 0 0 0' }}>
            {biglietti.map((biglietto, index) => (
              <li key={index} style={{ padding: '0.75rem 0', borderBottom: '1px dashed var(--border)' }}>
                🎟️ <strong>{biglietto.nome_evento || 'Evento'}</strong> — {biglietto.data_evento ? new Date(biglietto.data_evento).toLocaleDateString('it-IT') : ''} ({biglietto.quantita || 1}x)
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}