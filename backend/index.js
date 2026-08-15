import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import authRoutes from './Routes/authRoutes.js';
import productRoutes from './Routes/productRoutes.js';
import { errorHandler, notFound } from './Middleware/errorHandler.js';

if (!process.env.MONGO_CONN || !process.env.JWT_SECRET) throw new Error('MONGO_CONN and JWT_SECRET must be defined in .env');

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

const app = express();
app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser requests (curl, Postman) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Product Catalog API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 8000;
connectDatabase().then(() => app.listen(port, () => console.log(`Server running on port ${port}`))).catch((error) => { console.error('Database connection failed:', error.message); process.exit(1); });
