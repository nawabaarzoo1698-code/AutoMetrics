// Seeds FAKE, randomly generated data shaped like the dashboard.
// Replace with real data (VAHAN / SIAM / FADA / filings) via your own importer later.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env';
import {
  Category, Oem, VehicleModel, MonthlyFigure, OemFinancial,
  Supplier, Dealer, Article, User, Segment, Metric,
} from '../models';

// small deterministic RNG so reseeding gives the same numbers
let s = 42;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const between = (a: number, b: number) => Math.round(a + rnd() * (b - a));
const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const MONTHS = ['2026-05', '2026-06', '2026-07', '2026-08'];

// [name, segment, parent name, base monthly units]
const CATS: [string, Segment, string | null, number][] = [
  ['Passenger Vehicles', 'PV', null, 0],
  ['Passenger Cars', 'PV', 'Passenger Vehicles', 150000],
  ['Utility Vehicles', 'PV', 'Passenger Vehicles', 260000],
  ['Vans', 'PV', 'Passenger Vehicles', 12000],
  ['Two Wheelers', '2W', null, 0],
  ['Scooter', '2W', 'Two Wheelers', 900000],
  ['Motorcycles', '2W', 'Two Wheelers', 1500000],
  ['Mopeds', '2W', 'Two Wheelers', 50000],
  ['Three Wheelers', '3W', null, 0],
  ['Three Wheelers-Passenger Carrier', '3W', 'Three Wheelers', 130000],
  ['Three Wheelers-Goods Carrier', '3W', 'Three Wheelers', 13000],
  ['Commercial Vehicles', 'CV', null, 0],
];

const OEMS: [string, Segment][] = [
  ['Maruti Suzuki Demo Ltd', 'PV'], ['Tata Demo Motors', 'PV'], ['Mahindra Demo Ltd', 'PV'],
  ['Hyundai Demo India', 'PV'], ['Hero Demo Moto', '2W'], ['Honda Demo Two-Wheelers', '2W'],
  ['TVS Demo Motor', '2W'], ['Ashok Demo Leyland', 'CV'], ['Eicher Demo Trucks', 'CV'],
  ['Force Demo Motors', 'CV'],
];

const MODELS: [string, string, Segment][] = [
  ['Alpha Hatch', 'Maruti Suzuki Demo Ltd', 'PV'], ['Beta Sedan', 'Maruti Suzuki Demo Ltd', 'PV'],
  ['Gamma SUV', 'Tata Demo Motors', 'PV'], ['Delta Compact', 'Tata Demo Motors', 'PV'],
  ['Epsilon XUV', 'Mahindra Demo Ltd', 'PV'], ['Zeta Crossover', 'Hyundai Demo India', 'PV'],
  ['Eta MPV', 'Maruti Suzuki Demo Ltd', 'PV'], ['Theta Mini', 'Hyundai Demo India', 'PV'],
  ['Spark 100', 'Hero Demo Moto', '2W'], ['Glide Scooter', 'Honda Demo Two-Wheelers', '2W'],
  ['Apex 160', 'TVS Demo Motor', '2W'], ['City Commuter', 'Hero Demo Moto', '2W'],
];

async function main() {
  await mongoose.connect(env.mongoUri);
  await Promise.all([
    Category.deleteMany({}), Oem.deleteMany({}), VehicleModel.deleteMany({}),
    MonthlyFigure.deleteMany({}), OemFinancial.deleteMany({}), Supplier.deleteMany({}),
    Dealer.deleteMany({}), Article.deleteMany({}),
  ]);

  // categories (parents first so children can reference them)
  const catByName = new Map<string, any>();
  let order = 0;
  for (const [name, segment, parent] of CATS) {
    const doc = await Category.create({
      name, segment, slug: slug(name), order: order++,
      parentId: parent ? catByName.get(parent)._id : null,
    });
    catByName.set(name, doc);
  }

  const oems = await Oem.insertMany(OEMS.map(([name, segment]) => ({ name, segment, slug: slug(name) })));
  const oemByName = new Map(oems.map((o) => [o.name, o]));

  const models = await VehicleModel.insertMany(
    MODELS.map(([name, oem, segment]) => ({ name, segment, oemId: oemByName.get(oem)!._id }))
  );

  // monthly figures: category-level (cards) ...
  const figures: any[] = [];
  const metricFactor: Record<Metric, number> = { production: 1, domestic_sales: 0.8, exports: 0.2 };
  for (const month of MONTHS) {
    for (const metric of Object.keys(metricFactor) as Metric[]) {
      for (const [name, , parent, base] of CATS) {
        if (!parent) continue; // only leaf categories hold numbers
        figures.push({
          month, metric, categoryId: catByName.get(name)._id,
          units: Math.round(base * metricFactor[metric] * (0.85 + rnd() * 0.3)),
        });
      }
    }
    // ... model-level and OEM-level sales (top-N lists)
    const pc = catByName.get('Passenger Cars')._id;
    const scooter = catByName.get('Scooter')._id;
    for (const m of models) {
      figures.push({
        month, metric: 'domestic_sales', modelId: m._id, oemId: m.oemId,
        categoryId: m.segment === 'PV' ? pc : scooter,
        units: m.segment === 'PV' ? between(8000, 21000) : between(40000, 160000),
      });
    }
  }
  await MonthlyFigure.insertMany(figures);

  await OemFinancial.insertMany(
    oems.map((o) => ({
      oemId: o._id, fiscalYear: 2023,
      revenueCr: between(500, 90000), netProfitCr: between(5, 8000),
      revenueGrowthPct: between(10, 70), profitGrowthPct: between(20, 300),
    }))
  );

  await Supplier.insertMany(
    ['Apex Castings', 'Northwind Composites', 'Bluefin Foundries', 'Orbit Vibration Tech',
     'Meridian Components', 'Summit Industrial Products', 'Crest Auto Electric', 'Pinnacle Fasteners']
      .map((name) => ({ name, products: ['Castings', 'Electricals'] }))
  );

  await Dealer.insertMany(oems.map((o) => ({ oemId: o._id, networkSize: between(40, 800) })));

  await Article.insertMany([
    { title: 'Demo: new compact SUV unveiled', tag: 'Launches', body: 'Placeholder article.' },
    { title: 'Demo: EV adoption outlook', tag: 'Forecast', body: 'Placeholder article.' },
    { title: 'Demo: supplier consolidation', tag: 'Deal', body: 'Placeholder article.' },
  ]);

  await User.deleteMany({ email: 'demo@example.com' });
  await User.create({
    name: 'Demo User', email: 'demo@example.com',
    passwordHash: await bcrypt.hash('demo1234', 10),
  });

  console.log(`Seeded ${figures.length} monthly figures. Login: demo@example.com / demo1234`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
