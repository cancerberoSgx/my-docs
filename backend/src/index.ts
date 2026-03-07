import express from 'express';
import cors from 'cors';
import path from 'path';
import { runMigrations } from './db';
import authRoutes from './routes/authRoutes';
import listRoutes from './routes/listRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', listRoutes);

const apidocsPath = path.join(__dirname, '..', 'public', 'apidocs.html');
app.get('/apidocs', (req, res) => {
  res.sendFile(apidocsPath, (err) => {
    if (err) res.status(404).send('API docs not found. Run <code>npm run apidocs</code> first.');
  });
});

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to run migrations:', err);
  process.exit(1);
});
