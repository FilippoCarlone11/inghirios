import { config } from './config.js';
import { app } from './app.js';

app.listen(config.porta, () => {
  console.log(`inghirios server su http://localhost:${config.porta}`);
});