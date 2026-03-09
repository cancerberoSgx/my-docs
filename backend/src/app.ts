import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/authRoutes';
import listRoutes from './routes/listRoutes';
import documentsRoutes from './routes/documentsRoutes';
import accountRoutes from './routes/accountRoutes';
import adminRoutes from './routes/adminRoutes';
import toolsRoutes from './routes/toolsRoutes';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', accountRoutes);
app.use('/api', adminRoutes);
app.use('/api', toolsRoutes);
app.use('/api', listRoutes);
app.use('/api', documentsRoutes);

const apidocsPath = path.join(__dirname, '..', 'public', 'apidocs.html');
app.get('/apidocs', (req, res) => {
  res.sendFile(apidocsPath, (err) => {
    if (err) res.status(404).send('API docs not found. Run <code>npm run apidocs</code> first.');
  });
});
