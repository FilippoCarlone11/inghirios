export const CODICI_LUOGHI = [
  // ITALIA
  { codice: 'FCO', nome: 'Roma Fiumicino' },
  { codice: 'CIA', nome: 'Roma Ciampino' },
  { codice: 'MXP', nome: 'Milano Malpensa' },
  { codice: 'LIN', nome: 'Milano Linate' },
  { codice: 'BGY', nome: 'Milano Bergamo (Orio al Serio)' },
  { codice: 'TRN', nome: 'Torino Caselle' },
  { codice: 'VCE', nome: 'Venezia Marco Polo' },
  { codice: 'TSF', nome: 'Treviso Sant\'Angelo' },
  { codice: 'VRN', nome: 'Verona Valerio Catullo' },
  { codice: 'BLQ', nome: 'Bologna Guglielmo Marconi' },
  { codice: 'GOA', nome: 'Genova Cristoforo Colombo' },
  { codice: 'PSA', nome: 'Pisa Galileo Galilei' },
  { codice: 'FLR', nome: 'Firenze Peretola' },
  { codice: 'NAP', nome: 'Napoli Capodichino' },
  { codice: 'BRI', nome: 'Bari Karol Wojtyła' },
  { codice: 'BDS', nome: 'Brindisi Papola Casale' },
  { codice: 'SUF', nome: 'Lamezia Terme' },
  { codice: 'REG', nome: 'Reggio Calabria' },
  { codice: 'CTA', nome: 'Catania Fontanarossa' },
  { codice: 'PMO', nome: 'Palermo Falcone Borsellino' },
  { codice: 'TPS', nome: 'Trapani Birgi' },
  { codice: 'CAG', nome: 'Cagliari Elmas' },
  { codice: 'OLB', nome: 'Olbia Costa Smeralda' },
  { codice: 'AHO', nome: 'Alghero Fertilia' },

  // PRINCIPALI HUB EUROPEI E CAPITALI
  { codice: 'LHR', nome: 'Londra Heathrow' },
  { codice: 'LGW', nome: 'Londra Gatwick' },
  { codice: 'STN', nome: 'Londra Stansted' },
  { codice: 'CDG', nome: 'Parigi Charles de Gaulle' },
  { codice: 'ORY', nome: 'Parigi Orly' },
  { codice: 'BVA', nome: 'Parigi Beauvais' },
  { codice: 'AMS', nome: 'Amsterdam Schiphol' },
  { codice: 'FRA', nome: 'Francoforte sul Meno' },
  { codice: 'MUC', nome: 'Monaco di Baviera' },
  { codice: 'BER', nome: 'Berlino Brandeburgo' },
  { codice: 'DUS', nome: 'Düsseldorf' },
  { codice: 'MAD', nome: 'Madrid Barajas' },
  { codice: 'BCN', nome: 'Barcellona El Prat' },
  { codice: 'PMI', nome: 'Palma di Maiorca' },
  { codice: 'AGP', nome: 'Malaga Costa del Sol' },
  { codice: 'VLC', nome: 'Valencia' },
  { codice: 'LIS', nome: 'Lisbona Humberto Delgado' },
  { codice: 'OPO', nome: 'Porto Francisco Sá Carneiro' },
  { codice: 'DUB', nome: 'Dublino' },
  { codice: 'BRU', nome: 'Bruxelles Zaventem' },
  { codice: 'CRL', nome: 'Bruxelles Charleroi' },
  { codice: 'VIE', nome: 'Vienna Schwechat' },
  { codice: 'ZRH', nome: 'Zurigo Kloten' },
  { codice: 'GVA', nome: 'Ginevra Cointrin' },
  { codice: 'CPH', nome: 'Copenaghen Kastrup' },
  { codice: 'OSL', nome: 'Oslo Gardermoen' },
  { codice: 'ARN', nome: 'Stoccolma Arlanda' },
  { codice: 'HEL', nome: 'Helsinki Vantaa' },
  { codice: 'ATH', nome: 'Atene Eleftherios Venizelos' },
  { codice: 'WAW', nome: 'Varsavia Chopin' },
  { codice: 'WMI', nome: 'Varsavia Modlin' },
  { codice: 'PRG', nome: 'Praga Václav Havel' },
  { codice: 'BUD', nome: 'Budapest Ferenc Liszt' },
  { codice: 'OTP', nome: 'Bucarest Henri Coandă' },
  { codice: 'IST', nome: 'Istanbul' },
  { codice: 'SAW', nome: 'Istanbul Sabiha Gökçen' }
];

export const COMPAGNIE = [
  // COMPAGNIE AEREE ITALIANE E LOW COST PRINCIPALI
  'ita_airways',
  'ryanair',
  'easyjet',
  'wizz_air',
  'volotea',
  'vueling',
  'aeroitalia',
  'neos',
  
  // COMPAGNIE AEREE DI LINEA EUROPEE
  'lufthansa',
  'air_france',
  'klm',
  'british_airways',
  'iberia',
  'tap_portugal',
  'aegean_airlines',
  'sas_scandinavian',
  'finnair',
  'air_europa',
  'norwegian',
  'pegasus_airlines',
  'turkish_airlines',
  'swiss_international',
  'austrian_airlines',
  'brussels_airlines',
  'lot_polish',
  'aer_lingus',
  'transavia',
  'eurowings',
  'air_baltic',
  'icelandair',

  // TRENI
  'trenitalia',
  'italo',
  'sncf',
  'renfe',
  'deutsche_bahn',
  'oebb',
  'sbb_cff_ffs',

  // TRAGHETTI E NAVI
  'grimaldi_lines',
  'corsica_ferries',
  'moby_lines',
  'gnv',
  'tirrenia',
  'caremar',
  'siremar',

  // ALTRO
  'altra_compagnia',
  'nessuna'
];
export const ETICHETTE_RUOLO = {
  admin: 'Admin', contabilita: 'Contabilità', logisticaPRO: 'Logistica PRO',
  logistica: 'Logistica', runner: 'Runner', giurato: 'Giurato', ospite: 'Ospite'
};
export const STATI_BIGLIETTO = ['comprato', 'in_ritardo', 'arrivato', 'cancellato', 'rimborso_richiesto', 'rimborso_ottenuto'];

export const STATO_ICONA = {
  comprato: '🎟️',
  in_ritardo: '⏱️',
  arrivato: '✅',
  cancellato: '🚫',
  rimborso_richiesto: '📨',
  rimborso_ottenuto: '💶',
};

export const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .split(/\s+/).filter(Boolean).sort().join(' ');

export const formattaEnum = (t) => t?.replace(/_/g, ' ').toUpperCase() || '';


export const nomeLuogo = (codice) => CODICI_LUOGHI.find((l) => l.codice === codice)?.nome || '';

export const fmtData = (iso) => iso
  ? new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  : '';
export const fmtOra = (iso) => iso
  ? new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  : '';
export const fmtEuro = (n) => (n === null || n === undefined || n === '')
  ? '-'
  : Number(n).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });