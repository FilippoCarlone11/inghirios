import { useState } from 'react';
import CameraCard from './card-camera.jsx';

export default function AlloggioDettaglio({ 
  alloggio, camere, occupazioni, persone, accompagnatori, 
  membriOspiti, // <-- AGGIUNTO QUI
  onChiudi, onModificaAlloggio, onEliminaAlloggio, 
  onSalvaCamera, onModificaCamera, onRimuoviCamera, 
  onSalvaOccupazione, onRimuoviSoggiorno, onRimuoviNotte, onAggiornaRimborso 
}) {
  const [modificaIntestazione, setModificaIntestazione] = useState(false);
  const [formAlloggio, setFormAlloggio] = useState({ nome: alloggio.nome, indirizzo: alloggio.indirizzo });
  const [formCamera, setFormCamera] = useState({ posti_letto: '', costo_per_notte: '' });

  const postiTotali = camere.reduce((somma, c) => somma + Number(c.posti_letto), 0);
  const ospitiUnici = new Set();
  
  occupazioni.forEach(o => {
    if (o.id_persona) ospitiUnici.add(`p_${o.id_persona}`);
    if (o.id_accompagnatore) ospitiUnici.add(`a_${o.id_accompagnatore}`);
    if (o.id_membro_ospite) ospitiUnici.add(`m_${o.id_membro_ospite}`); // <-- AGGIUNTO QUI AL CONTEGGIO
  });

  const onSubmitAlloggio = async (e) => {
    e.preventDefault();
    const ok = await onModificaAlloggio(alloggio.id, formAlloggio);
    if (ok) setModificaIntestazione(false);
  };

  const onSubmitCamera = async (e) => {
    e.preventDefault();
    const ok = await onSalvaCamera(formCamera);
    if (ok) setFormCamera({ posti_letto: '', costo_per_notte: '' });
  };

  return (
    <>
      <button className="btn-secondary" onClick={onChiudi} style={{ marginBottom: '1.5rem' }}>← Torna agli alloggi</button>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        {modificaIntestazione ? (
          <form onSubmit={onSubmitAlloggio} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Modifica alloggio</h2>
            <label style={{ display: 'block' }}>Nome<input type="text" value={formAlloggio.nome} onChange={(e) => setFormAlloggio({ ...formAlloggio, nome: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} /></label>
            <label style={{ display: 'block' }}>Indirizzo<input type="text" value={formAlloggio.indirizzo} onChange={(e) => setFormAlloggio({ ...formAlloggio, indirizzo: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} /></label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit">Salva modifiche</button>
              <button type="button" className="btn-secondary" onClick={() => setModificaIntestazione(false)}>Annulla</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ marginBottom: '0.5rem' }}>{alloggio.nome}</h1>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>{alloggio.indirizzo}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={() => setModificaIntestazione(true)}>Modifica alloggio</button>
                <button 
                  style={{ backgroundColor: 'transparent', color: '#b42318', border: '1px solid #b42318', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '4px' }} 
                  onClick={() => {
                    if(window.confirm('Vuoi davvero eliminare questo B&B? Verranno eliminate anche tutte le camere e le prenotazioni.')) onEliminaAlloggio(alloggio.id);
                  }}>
                  Elimina
                </button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{camere.length}</div><div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Camere</div></div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{postiTotali}</div><div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Posti letto</div></div>
          <div><div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{ospitiUnici.size}</div><div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ospiti</div></div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Aggiungi camera</h3>
        <form onSubmit={onSubmitCamera} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ flex: '1', minWidth: '150px', display: 'block' }}>Posti letto
            <input type="number" min="1" value={formCamera.posti_letto} onChange={(e) => setFormCamera({ ...formCamera, posti_letto: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} />
          </label>
          <label style={{ flex: '1', minWidth: '150px', display: 'block' }}>Costo a notte (€)
            <input type="number" step="0.01" min="0" value={formCamera.costo_per_notte} onChange={(e) => setFormCamera({ ...formCamera, costo_per_notte: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} />
          </label>
          <button type="submit" style={{ whiteSpace: 'nowrap' }}>Aggiungi camera</button>
        </form>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Gestione Camere</h2>
      {camere.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Nessuna camera registrata per questo alloggio.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {camere.map((camera, index) => (
            <CameraCard
              key={camera.id} camera={camera} numeroCamera={index + 1}
              occupazioni={occupazioni} persone={persone} accompagnatori={accompagnatori} 
              membriOspiti={membriOspiti} /* <-- PASSATO AL FIGLIO QUI */
              onAssegna={onSalvaOccupazione} onModifica={onModificaCamera}
              onRimuoviCamera={onRimuoviCamera} onRimuoviSoggiorno={onRimuoviSoggiorno}
              onRimuoviNotte={onRimuoviNotte} onAggiornaRimborso={onAggiornaRimborso}
            />
          ))}
        </div>
      )}
    </>
  );
}