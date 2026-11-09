import { useState } from 'react';
import { euro, aISO, formattaData, costruisciSoggiorni, stilePericolo, stileBottonePiccolo } from './alloggi-utils.js';

export default function CameraCard({ 
  camera, numeroCamera, occupazioni, persone, accompagnatori, 
  membriOspiti, // <-- AGGIUNTO QUI (senza questo crasha)
  onAssegna, onModifica, onRimuoviCamera, onRimuoviSoggiorno, onRimuoviNotte, onAggiornaRimborso 
}) {
  const formVuoto = { idSelezionato: '', data_inizio: '', data_fine: '' };
  const [form, setForm] = useState(formVuoto);
  const [formAperto, setFormAperto] = useState(false);
  const [inModifica, setInModifica] = useState(false);
  const [soggiorniEspansi, setSoggiorniEspansi] = useState({});
  const [formCamera, setFormCamera] = useState({
    posti_letto: camera.posti_letto,
    costo_per_notte: camera.costo_per_notte
  });

  const soggiorni = costruisciSoggiorni(camera.id, occupazioni);

  const toggleSoggiorno = (chiave) => {
    setSoggiorniEspansi(prev => ({ ...prev, [chiave]: !prev[chiave] }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    let id_persona = null; let id_accompagnatore = null; let id_membro_ospite = null;
    
    if (form.idSelezionato.startsWith('p_')) id_persona = Number(form.idSelezionato.replace('p_', ''));
    else if (form.idSelezionato.startsWith('a_')) id_accompagnatore = Number(form.idSelezionato.replace('a_', ''));
    else if (form.idSelezionato.startsWith('m_')) id_membro_ospite = Number(form.idSelezionato.replace('m_', ''));

    const ok = await onAssegna(camera.id, { id_persona, id_accompagnatore, id_membro_ospite, data_inizio: form.data_inizio, data_fine: form.data_fine });
    
    if (ok) {
      setForm(formVuoto); setFormAperto(false);
      if (id_accompagnatore || id_membro_ospite) {
        // Nessun alert bloccante, ricarica serenamente
      }
    }
  };

  const onSubmitCamera = async (e) => {
    e.preventDefault();
    const ok = await onModifica(camera.id, formCamera);
    if (ok) setInModifica(false);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' }}>
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>Camera {numeroCamera}</h3>
          <span style={{ fontWeight: '500' }}>{camera.posti_letto} posti letto, {euro(camera.costo_per_notte)} a notte</span>
        </div>
        {!inModifica && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" style={stileBottonePiccolo} onClick={() => setInModifica(true)}>Modifica</button>
            <button style={{ ...stilePericolo, ...stileBottonePiccolo }} onClick={() => onRimuoviCamera(camera.id)}>Elimina</button>
          </div>
        )}
      </div>

      <div style={{ padding: '1.5rem' }}>
        {inModifica && (
          <form onSubmit={onSubmitCamera} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Modifica camera</h5>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, display: 'block', minWidth: '120px' }}>Posti letto 
                <input type="number" min="1" value={formCamera.posti_letto} onChange={(e) => setFormCamera({ ...formCamera, posti_letto: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} />
              </label>
              <label style={{ flex: 1, display: 'block', minWidth: '120px' }}>Costo a notte (€) 
                <input type="number" step="0.01" min="0" value={formCamera.costo_per_notte} onChange={(e) => setFormCamera({ ...formCamera, costo_per_notte: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit">Salva</button>
              <button type="button" className="btn-secondary" onClick={() => setInModifica(false)}>Annulla</button>
            </div>
          </form>
        )}

        <div style={{ marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Ospiti assegnati</h4>
        </div>

        {soggiorni.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>Nessun ospite in questa camera.</p>
        ) : (
          <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            {soggiorni.map((s, i) => {
              const chiaveEspansione = `${s.chiaveUnica}-${s.inizio}`;
              const isExpanded = soggiorniEspansi[chiaveEspansione];
            
              let testoEtichetta = null;
              if (s.id_accompagnatore) {
                const acc = (accompagnatori || []).find(a => a.id === s.id_accompagnatore);
                if (acc) {
                  const princ = (persone || []).find(p => p.id === acc.id_persona);
                  if (princ) testoEtichetta = ` (Accompagnatore di ${princ.nome} ${princ.cognome})`;
                }
              } else if (s.id_membro_ospite) {
                const mem = (membriOspiti || []).find(m => m.id === s.id_membro_ospite);
                if (mem) testoEtichetta = ` (Membro extra di ${mem.nome_gruppo} ${mem.cognome_gruppo})`;
              }

              return (
                <div key={chiaveEspansione} style={{ padding: '0.75rem 1rem', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  
                  {/* RIGA PRINCIPALE CLICCABILE */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div 
                      onClick={() => toggleSoggiorno(chiaveEspansione)} 
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', width: '15px' }}>
                        {isExpanded ? '▾' : '▸'}
                      </span>
                      <div>
                        <strong>{s.nome}</strong> 
                        {testoEtichetta && <span style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>{testoEtichetta}</span>}
                        <span style={{ fontWeight: 'normal' }}> (dal {formattaData(s.inizio)} al {formattaData(s.fine)})</span>
                      </div>
                    </div>
                    <button style={{ ...stilePericolo, ...stileBottonePiccolo }} onClick={() => onRimuoviSoggiorno(camera.id, s)}>
                      Rimuovi
                    </button>
                  </div>

                  {/* TENDINA NOTTI (VISIBILE SOLO SE ESPANSA) */}
                  {isExpanded && (
                    <div style={{ marginTop: '1rem', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border)' }}>
                      {s.nottiIndividuali.map((notte) => {
                        const isRimborsato = notte.da_rimborsare;
                        return (
                          <div key={notte.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', alignItems: 'center' }}>
                            <span>{formattaData(aISO(notte.data))}</span>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <button 
                                type="button"
                                onClick={() => onAggiornaRimborso(notte.id, !isRimborsato)}
                                style={{
                                  backgroundColor: isRimborsato ? '#12b76a' : '#f2f4f7', 
                                  color: isRimborsato ? 'white' : 'var(--text-muted)',
                                  border: '1px solid', borderColor: isRimborsato ? '#12b76a' : '#d0d5dd',
                                  padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer',
                                  fontSize: '0.85rem', fontWeight: 500, minWidth: '130px'
                                }}>
                                {isRimborsato ? 'Da rimborsare' : 'Non rimborsare'}
                              </button>
                              <button style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => onRimuoviNotte(notte.id)} title="Elimina notte">✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!formAperto ? (
          <button className="btn-secondary" onClick={() => setFormAperto(true)}>Aggiungi ospite</button>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Nuova assegnazione</h5>
            <label style={{ display: 'block' }}>Ospite
              <select value={form.idSelezionato} onChange={(e) => setForm({ ...form, idSelezionato: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }}>
                <option value="">Seleziona una persona</option>
                
                <optgroup label="Ospiti principali">
                  {persone.map((p) => <option key={`p_${p.id}`} value={`p_${p.id}`}>{p.nome} {p.cognome}</option>)}
                </optgroup>
                
                {accompagnatori && accompagnatori.length > 0 && (
                  <optgroup label="Accompagnatori">
                    {accompagnatori.map((a) => {
                      const princ = (persone || []).find(p => p.id === a.id_persona);
                      const nomePrinc = princ ? `${princ.nome} ${princ.cognome}` : 'Sconosciuto';
                      return <option key={`a_${a.id}`} value={`a_${a.id}`}>{a.nome} {a.cognome} (Accomp. di {nomePrinc})</option>;
                    })}
                  </optgroup>
                )}
                
                {membriOspiti && membriOspiti.length > 0 && (
                  <optgroup label="Ospiti in gruppo">
                    {membriOspiti.map((m) => (
                      <option key={`m_${m.id}`} value={`m_${m.id}`}>
                        {m.nome} {m.cognome} (Componente di {m.nome_gruppo} {m.cognome_gruppo})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, display: 'block', minWidth: '120px' }}>Dal <input type="date" value={form.data_inizio} onChange={(e) => setForm({ ...form, data_inizio: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} /></label>
              <label style={{ flex: 1, display: 'block', minWidth: '120px' }}>Al <input type="date" value={form.data_fine} min={form.data_inizio} onChange={(e) => setForm({ ...form, data_fine: e.target.value })} required style={{ width: '100%', boxSizing: 'border-box', marginTop: '0.25rem' }} /></label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit">Salva assegnazione</button>
              <button type="button" className="btn-secondary" onClick={() => { setForm(formVuoto); setFormAperto(false); }}>Annulla</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}