import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { cached } from '../services/cache';
import * as svc from '../services/dashboard.service';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be YYYY-MM');
const segmentSchema = z.enum(['PV', '2W', '3W', 'CV']);

dashboardRouter.get('/months', async (_req, res) => {
  res.json(await cached('dashboard:months', svc.availableMonths));
});

dashboardRouter.get('/summary', async (req, res) => {
  const month = monthSchema.safeParse(req.query.month);
  if (!month.success) return res.status(400).json({ error: month.error.issues[0].message });
  res.json(await cached(`dashboard:summary:${month.data}`, () => svc.getSummary(month.data)));
});

dashboardRouter.get('/top-models', async (req, res) => {
  const month = monthSchema.safeParse(req.query.month);
  const segment = segmentSchema.safeParse(req.query.segment ?? 'PV');
  if (!month.success || !segment.success) return res.status(400).json({ error: 'Bad month or segment' });
  res.json(await cached(`dashboard:top-models:${month.data}:${segment.data}`,
    () => svc.getTopModels(month.data, segment.data)));
});

dashboardRouter.get('/top-oems', async (req, res) => {
  const month = monthSchema.safeParse(req.query.month);
  const segment = segmentSchema.safeParse(req.query.segment ?? 'CV');
  if (!month.success || !segment.success) return res.status(400).json({ error: 'Bad month or segment' });
  res.json(await cached(`dashboard:top-oems:${month.data}:${segment.data}`,
    () => svc.getTopOems(month.data, segment.data)));
});

dashboardRouter.get('/financials', async (req, res) => {
  const fy = Number(req.query.fy ?? 2023);
  res.json(await cached(`dashboard:financials:${fy}`, () => svc.getFinancials(fy)));
});

dashboardRouter.get('/suppliers', async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 8)));
  res.json(await svc.getSuppliers(page, limit));
});

dashboardRouter.get('/dealers', async (_req, res) => {
  res.json(await cached('dashboard:dealers', svc.getDealers));
});

dashboardRouter.get('/news', async (req, res) => {
  res.json(await svc.getNews(req.query.tag ? String(req.query.tag) : undefined));
});
