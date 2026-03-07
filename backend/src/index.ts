import { app } from './app';
import { runMigrations } from './db';

const PORT = process.env.PORT || 3001;

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to run migrations:', err);
  process.exit(1);
});
