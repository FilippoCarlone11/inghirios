import { Routes, Route } from 'react-router-dom';
import Protection from './components/Protection.jsx';
import AppLayout from './components/AppLayout.jsx';
import Login from './pages/accounts/Login.jsx';
import Home from './pages/Home.jsx';

import CreaAccount from './pages/accounts/Crea-account.jsx'
import GestioneGiurati from './pages/accounts/gestione-giurati.jsx'
import GestioneStaffLogistica from './pages/accounts/gestione-staff-logistica.jsx'
import GestioneRunners from './pages/accounts/gestione-runners.jsx'
import GestioneBiglietti from './pages/biglietti/gestione-biglietti.jsx'
import GestioneTransfer from './pages/transfer/gestione-transfer.jsx'
import GestioneLiberatorie from './pages/accounts/gestione-liberatorie.jsx';
import GestioneAlloggi from './pages/alloggi/gestione-alloggi.jsx';
import GestioneAccompagnatori from './pages/accounts/gestione-accompagnatori.jsx';
import GestioneOspiti from './pages/accounts/gestione-ospiti.jsx';

export default function App() {
  return (
    <Routes>
      {/* Rotta pubblica (senza menu laterale) */}
      <Route path="/login" element={<Login />} />

      {/* Tutte le rotte dentro AppLayout avranno il menu laterale */}
      <Route element={<AppLayout />}>
        
        {/* Rotte protette generiche */}
        <Route element={<Protection />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* Rotte protette solo per Admin */}
        <Route element={<Protection ruoli={['admin']} />}>
          <Route path="/crea-account" element={<CreaAccount />} />
          <Route path="/gestione-giurati" element={<GestioneGiurati />} />
          <Route path="/gestione-staff-logistica" element={<GestioneStaffLogistica />} />
          <Route path="/gestione-runners" element={<GestioneRunners />} />
          <Route path="/gestione-biglietti" element={<GestioneBiglietti />} />
          <Route path="/gestione-transfer" element={<GestioneTransfer />} />
          <Route path="/gestione-liberatorie" element={<GestioneLiberatorie />} />
          <Route path="/gestione-alloggi" element={<GestioneAlloggi />} />
          <Route path="/gestione-accompagnatori" element={<GestioneAccompagnatori />} />
          <Route path="/gestione-ospiti" element={<GestioneOspiti />} />
        </Route>

      </Route>
    </Routes>
  );
}