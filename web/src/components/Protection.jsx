import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Protection({ ruoli }){
    const {utente, caricamento} = useAuth();

    if(caricamento) return <p>Caricamento in corso..</p>
    if(!utente) return <Navigate to="\login" replace />
    if(ruoli){
        if(!ruoli.includes(utente.ruolo))
            return <p>Non hai i permessi per vedere questa pagina.</p>
    }

    return <Outlet />
}