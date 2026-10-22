import { Router } from 'express';
import { richiediAuth } from '../../middleware/authentication.js';
import { ELENCO_RUOLI } from '../../ruoli.js';

const router = Router();

router.get('/', richiediAuth, (req, res) => {
  res.json(ELENCO_RUOLI);
});

export default router;