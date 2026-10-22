import 'dotenv/config';

function richiesta(nome) {
  const valore = process.env[nome];
  if (!valore) {
    throw new Error(`Variabile d'ambiente mancante: ${nome}`);
  }
  return valore;
}

export const config = {
  porta: Number(process.env.PORT ?? 3000),
  databaseUrl: richiesta('DATABASE_URL'),
  jwtSecret: richiesta('JWT_SECRET'),
};