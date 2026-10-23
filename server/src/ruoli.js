export const RUOLI = {
  ADMIN: 'admin',
  CONTABILITA: 'contabilita',
  LOGISTICA_PRO: 'logistica_pro',
  LOGISTICA: 'logistica',
  RUNNER: 'runner',
  GIURATO: 'giurato',
  OSPITE: 'ospite',
};

export const GIURIE = {
  tecnica: 'tecnica',
  internazionale: 'internazionale',
  critica: 'critica',
};

export const PARTECIPAZIONI = {
  in_loco: 'in loco',
  da_remoto: 'da remoto',
};

export const ELENCO_RUOLI = Object.values(RUOLI);
export const TIPO_GIURIA = Object.values(GIURIE);
export const TIPO_PARTECIPAZIONE = Object.values(PARTECIPAZIONI)