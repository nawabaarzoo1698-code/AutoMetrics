import { Types } from 'mongoose';
import {
  Category, MonthlyFigure, OemFinancial, Oem, Dealer, Supplier, Article, Metric, Segment,
} from '../models';

export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const pct = (cur: number, prev: number) =>
  prev === 0 ? null : Math.round(((cur - prev) / prev) * 10000) / 100;

// Sum units per category for one month + metric (only category-level rows: no model/OEM)
async function sumByCategory(month: string, metric: Metric) {
  const rows = await MonthlyFigure.aggregate([
    { $match: { month, metric, modelId: { $exists: false } } },
    { $group: { _id: '$categoryId', units: { $sum: '$units' } } },
  ]);
  return new Map<string, number>(rows.map((r) => [String(r._id), r.units]));
}

// Builds one card: total + MoM %, plus a tree of segments and subcategories.
export async function buildSummaryCard(month: string, metric: Metric) {
  const [cats, cur, prev] = await Promise.all([
    Category.find().sort({ order: 1 }).lean(),
    sumByCategory(month, metric),
    sumByCategory(previousMonth(month), metric),
  ]);

  const childrenOf = (id: Types.ObjectId) => cats.filter((c) => String(c.parentId) === String(id));
  const roots = cats.filter((c) => !c.parentId);

  let total = 0;
  let prevTotal = 0;
  const groups = roots.map((root) => {
    const kids = childrenOf(root._id).map((k) => {
      const units = cur.get(String(k._id)) ?? 0;
      const p = prev.get(String(k._id)) ?? 0;
      return { name: k.name, units, changePct: pct(units, p), _prev: p };
    });
    const units = kids.reduce((a, k) => a + k.units, 0);
    const p = kids.reduce((a, k) => a + k._prev, 0);
    total += units;
    prevTotal += p;
    return {
      name: root.name, segment: root.segment, units, changePct: pct(units, p),
      children: kids.map(({ _prev, ...rest }) => rest),
    };
  }).filter((g) => g.children.length > 0);

  return { metric, month, totalUnits: total, changePct: pct(total, prevTotal), groups };
}

export async function getSummary(month: string) {
  const [production, sales, exports] = await Promise.all(
    (['production', 'domestic_sales', 'exports'] as Metric[]).map((m) => buildSummaryCard(month, m))
  );
  return { month, production, domesticSales: sales, exports };
}

// Top-N models (by units) for a segment, with MoM change.
export async function getTopModels(month: string, segment: Segment, limit = 10) {
  const sumByModel = async (mo: string) =>
    MonthlyFigure.aggregate([
      { $match: { month: mo, metric: 'domestic_sales', modelId: { $exists: true } } },
      { $lookup: { from: 'vehiclemodels', localField: 'modelId', foreignField: '_id', as: 'm' } },
      { $unwind: '$m' },
      { $match: { 'm.segment': segment } },
      { $group: { _id: '$modelId', name: { $first: '$m.name' }, units: { $sum: '$units' } } },
    ]);
  const [cur, prev] = await Promise.all([sumByModel(month), sumByModel(previousMonth(month))]);
  const prevMap = new Map(prev.map((r) => [String(r._id), r.units]));
  return cur
    .sort((a, b) => b.units - a.units)
    .slice(0, limit)
    .map((r) => ({ name: r.name, units: r.units, changePct: pct(r.units, prevMap.get(String(r._id)) ?? 0) }));
}

// Top-N OEMs for a segment.
export async function getTopOems(month: string, segment: Segment, limit = 10) {
  const sumByOem = async (mo: string) =>
    MonthlyFigure.aggregate([
      { $match: { month: mo, metric: 'domestic_sales', oemId: { $exists: true } } },
      { $lookup: { from: 'oems', localField: 'oemId', foreignField: '_id', as: 'o' } },
      { $unwind: '$o' },
      { $match: { 'o.segment': segment } },
      { $group: { _id: '$oemId', name: { $first: '$o.name' }, units: { $sum: '$units' } } },
    ]);
  const [cur, prev] = await Promise.all([sumByOem(month), sumByOem(previousMonth(month))]);
  const prevMap = new Map(prev.map((r) => [String(r._id), r.units]));
  return cur
    .sort((a, b) => b.units - a.units)
    .slice(0, limit)
    .map((r) => ({ name: r.name, units: r.units, changePct: pct(r.units, prevMap.get(String(r._id)) ?? 0) }));
}

export async function getFinancials(fiscalYear: number) {
  const rows = await OemFinancial.find({ fiscalYear }).populate('oemId', 'name').lean();
  return rows.map((r: any) => ({
    oem: r.oemId?.name, revenueCr: r.revenueCr, netProfitCr: r.netProfitCr,
    revenueGrowthPct: r.revenueGrowthPct, profitGrowthPct: r.profitGrowthPct,
  }));
}

export async function getSuppliers(page: number, limit: number) {
  const [items, total] = await Promise.all([
    Supplier.find().skip((page - 1) * limit).limit(limit).lean(),
    Supplier.countDocuments(),
  ]);
  return { items, total, page, limit };
}

export async function getDealers() {
  const rows = await Dealer.find().populate('oemId', 'name').lean();
  return rows.map((r: any) => ({ name: r.oemId?.name, network: r.networkSize }));
}

export async function getNews(tag?: string) {
  return Article.find(tag ? { tag } : {}).sort({ publishedAt: -1 }).limit(20).lean();
}

export async function availableMonths(): Promise<string[]> {
  const months = await MonthlyFigure.distinct('month');
  return months.sort().reverse();
}

export { Oem };
