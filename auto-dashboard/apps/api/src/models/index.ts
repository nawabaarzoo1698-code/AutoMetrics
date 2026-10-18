import { Schema, model, Types } from 'mongoose';

export type Segment = 'PV' | '2W' | '3W' | 'CV';
export type Metric = 'production' | 'domestic_sales' | 'exports';

// ---- Category tree: Passenger Vehicles > Passenger Cars, Utility Vehicles ...
const categorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  segment: { type: String, enum: ['PV', '2W', '3W', 'CV'], required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  order: { type: Number, default: 0 },
});
export const Category = model('Category', categorySchema);

const oemSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  segment: { type: String, enum: ['PV', '2W', '3W', 'CV'], required: true },
  logoUrl: String,
});
export const Oem = model('Oem', oemSchema);

const vehicleModelSchema = new Schema({
  name: { type: String, required: true },
  oemId: { type: Schema.Types.ObjectId, ref: 'Oem', required: true },
  segment: { type: String, enum: ['PV', '2W', '3W', 'CV'], required: true },
});
export const VehicleModel = model('VehicleModel', vehicleModelSchema);

// ---- The core fact table. One row = one number for one month.
const monthlyFigureSchema = new Schema({
  month: { type: String, required: true }, // 'YYYY-MM'
  metric: { type: String, enum: ['production', 'domestic_sales', 'exports'], required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  oemId: { type: Schema.Types.ObjectId, ref: 'Oem' },
  modelId: { type: Schema.Types.ObjectId, ref: 'VehicleModel' },
  units: { type: Number, required: true },
});
monthlyFigureSchema.index({ month: 1, metric: 1, categoryId: 1 });
monthlyFigureSchema.index({ month: 1, metric: 1, modelId: 1 });
monthlyFigureSchema.index({ month: 1, metric: 1, oemId: 1 });
export const MonthlyFigure = model('MonthlyFigure', monthlyFigureSchema);

const oemFinancialSchema = new Schema({
  oemId: { type: Schema.Types.ObjectId, ref: 'Oem', required: true },
  fiscalYear: { type: Number, required: true },
  revenueCr: Number,
  netProfitCr: Number,
  revenueGrowthPct: Number,
  profitGrowthPct: Number,
});
oemFinancialSchema.index({ fiscalYear: 1, oemId: 1 }, { unique: true });
export const OemFinancial = model('OemFinancial', oemFinancialSchema);

export const Supplier = model(
  'Supplier',
  new Schema({ name: { type: String, required: true }, logoUrl: String, products: [String] })
);

export const Dealer = model(
  'Dealer',
  new Schema({
    oemId: { type: Schema.Types.ObjectId, ref: 'Oem', required: true },
    networkSize: { type: Number, required: true },
  })
);

export const Article = model(
  'Article',
  new Schema({
    title: { type: String, required: true },
    body: String,
    tag: {
      type: String,
      enum: ['Launches', 'Analysis', 'Deal', 'Dealership', 'Forecast', 'Technology & Innovation'],
      required: true,
    },
    publishedAt: { type: Date, default: Date.now },
  })
);

export const User = model(
  'User',
  new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
  })
);

export type Id = Types.ObjectId;
