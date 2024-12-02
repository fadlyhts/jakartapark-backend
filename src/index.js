import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { initializeDatabase } from './config/database.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import fileUpload from 'express-fileupload';

const app = express();
const port = process.env.PORT || 3000;

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  createParentPath: true
}));

// Mount all routes (remove the global auth middleware)
app.use('/api', routes);

// Add error handler as the last middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});