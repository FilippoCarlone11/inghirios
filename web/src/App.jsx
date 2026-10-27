import { Routes, Route } from 'react-router-dom';
import Protection from './components/Protection.jsx';
import Login from './pages/accounts/Login.jsx';
import Home from './pages/Home.jsx';

import CreaAccount from './pages/accounts/Crea-account.jsx'
import CreaGiurato from './pages/accounts/crea-giurato.jsx'
import GestioneGiurati from './pages/accounts/gestione-giurati.jsx'
import GestioneStaffLogistica from './pages/accounts/gestione-staff-logistica.jsx'
import GestioneRunners from './pages/accounts/gestione-runners.jsx'
import GestioneBiglietti from './pages/biglietti/gestione-biglietti.jsx'
import GestioneTransfer from './pages/transfer/gestione-transfer.jsx'
import GestioneLiberatorie from './pages/accounts/gestione-liberatorie.jsx';


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Protection />}>
        <Route path="/" element={<Home />} />
      </Route>

      <Route element={<Protection ruoli={['admin']} />}>
        <Route path="/crea-account" element={<CreaAccount />} />
        <Route path="/crea-giurato" element={<CreaGiurato />} />
        <Route path="/gestione-giurati" element={<GestioneGiurati />} />
        <Route path="/gestione-staff-logistica" element={<GestioneStaffLogistica />} />
        <Route path="/gestione-runners" element={<GestioneRunners />} />
        <Route path="/gestione-biglietti" element={<GestioneBiglietti />} />
        <Route path="/gestione-transfer" element={<GestioneTransfer />} />
        <Route path="/gestione-liberatorie" element={<GestioneLiberatorie />} />
      </Route>
    </Routes>
  );
}