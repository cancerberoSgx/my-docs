import express from 'express';
import cors from 'cors';
import { runMigrations } from './db';
import authRoutes from './routes/authRoutes';
import listRoutes from './routes/listRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', listRoutes);

runMigrations();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
