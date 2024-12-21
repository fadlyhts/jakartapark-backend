import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import authRoutes from './routes/authRoutes.js';
import parkRoutes from './routes/parkRoutes.js';
import damagedParkRoutes from './routes/damagedParkRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve files from backend root
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parks', parkRoutes);
app.use('/api/damaged-parks', damagedParkRoutes);

export default app;
