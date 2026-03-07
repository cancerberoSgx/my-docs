import express from 'express';
import cors from 'cors';
import { runMigrations } from './db';
import authRoutes from './routes/authRoutes';
import documentRoutes from './routes/documentRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/', authRoutes);
app.use('/', documentRoutes);

runMigrations();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
