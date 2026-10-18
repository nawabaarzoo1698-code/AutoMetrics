import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectMongo, connectRedis } from './config/db';
import { authRouter } from './routes/auth.routes';
import { dashboardRouter } from './routes/dashboard.routes';

async function main() {
  await connectMongo();
  await connectRedis();

  const app = express();
  // CORS_ORIGIN: comma-separated list of allowed frontends (e.g. your Vercel URL). Unset = allow all (dev only).
  const origins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors(origins?.length ? { origin: origins } : undefined));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/auth', authRouter);
  app.use('/dashboard', dashboardRouter);

  // central error handler: Express 4 doesn't catch async errors, so keep handlers simple
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(env.port, () => console.log(`API on http://localhost:${env.port}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
