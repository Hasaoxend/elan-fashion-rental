import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { productRouter } from './routes/product.routes';
import { bookingRouter } from './routes/booking.routes';
import { authRouter } from './routes/auth.routes';
import { adminRouter } from './routes/admin.routes';
import { initSocket } from './realtime';
import { AppError } from './constants';
import { prisma } from './db';

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT ?? 4000);
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000,http://localhost:3001').split(',').map((origin) => origin.trim());

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 60_000, limit: 240, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/health', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ ok: true, service: 'fashion-rental-api', timestamp: new Date().toISOString() }); }
  catch { res.status(503).json({ ok: false }); }
});
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/admin', adminRouter);

app.use((_req, _res, next) => { next(new AppError('Không tìm thấy endpoint.', 404, 'NOT_FOUND')); });
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction): void => {
  console.error(error);
  if (error instanceof AppError) { res.status(error.statusCode).json({ code: error.code, message: error.message }); return; }
  if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') { res.status(409).json({ code: 'DUPLICATE', message: 'Dữ liệu đã tồn tại.' }); return; }
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi máy chủ.' });
});

initSocket(server, allowedOrigins);
server.listen(port, () => console.log(`Fashion Rental API listening on http://localhost:${port}`));

const shutdown = async () => { await prisma.$disconnect(); server.close(() => process.exit(0)); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
