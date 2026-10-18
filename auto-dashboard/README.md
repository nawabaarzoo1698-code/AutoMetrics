# Auto Dashboard: step-by-step build guide

A dashboard for vehicle production, sales, exports, OEM financials, suppliers, dealers and news.
All data is **fake seed data**. Swap in public data (VAHAN, SIAM, FADA, BSE/NSE filings) later.

## What exists now (Phase 1 to 4: backend)

```
apps/api/src
  config/       env.ts, db.ts            Mongo + Redis connections
  models/       index.ts                 All Mongoose schemas + indexes
  scripts/      seed.ts                  Fake data generator
  services/     dashboard.service.ts     Aggregation logic (the core)
                cache.ts                 Redis cache-aside helper
  middleware/   auth.ts                  JWT guard
  routes/       auth.routes.ts           POST /auth/login, GET /auth/me
                dashboard.routes.ts      /dashboard/* endpoints
  server.ts                              Express app entry
```

## Run it

Prerequisites: Node 18+, MongoDB running locally, Redis (optional, API works without it).

```bash
cd apps/api
cp .env.example .env
npm install
npm run seed      # creates demo data + user demo@example.com / demo1234
npm run dev       # http://localhost:4000
```

Quick test:

```bash
TOKEN=$(curl -s localhost:4000/auth/login -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"demo1234"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s "localhost:4000/dashboard/summary?month=2026-08" -H "Authorization: Bearer $TOKEN"
curl -s "localhost:4000/dashboard/top-models?month=2026-08&segment=PV" -H "Authorization: Bearer $TOKEN"
```

## Learn it: how each piece works

### Step 1. The data model (`models/index.ts`)
The key idea is the **fact table**: `MonthlyFigure` stores one number per (month, metric, category).
Everything on the dashboard is a *sum* or *ranking* over this one collection.
Percentages are never stored; they are computed. Notice the compound indexes on
`{ month, metric, ... }`: every query filters by month and metric first.

### Step 2. The category tree
`Category` has `parentId`. "Passenger Vehicles" is a root, "Passenger Cars" is a child.
Only **leaf** categories hold numbers. Parent totals are summed in code. This avoids
double counting and keeps the data clean.

### Step 3. The summary aggregation (`buildSummaryCard`)
1. `$match` one month + metric.
2. `$group` by `categoryId` and `$sum` units.
3. Do the same for the previous month (`previousMonth()`).
4. Build the tree in memory and compute `changePct = (cur - prev) / prev * 100`.

This is the heart of the project. Read it twice, then try changing it to year-over-year.

### Step 4. Top-N lists (`getTopModels`, `getTopOems`)
Uses `$lookup` (a join) to attach the model/OEM, filters by segment, groups, then sorts
and slices in code. Same current vs previous month pattern.

### Step 5. Caching (`cache.ts`)
Cache-aside: check Redis, otherwise compute and store with a TTL.
Keys look like `dashboard:summary:2026-08`. After importing new data, call
`invalidate()` so stale numbers disappear.

### Step 6. Auth (`auth.routes.ts`, `middleware/auth.ts`)
Passwords are hashed with bcrypt. Login returns a signed JWT. The middleware verifies
`Authorization: Bearer <token>` and rejects otherwise. All `/dashboard/*` routes are protected.

## API reference

| Endpoint | Purpose |
|---|---|
| `POST /auth/login` | email + password, returns JWT |
| `GET /dashboard/months` | months available for the pickers |
| `GET /dashboard/summary?month=YYYY-MM` | 3 cards, category rows, % change |
| `GET /dashboard/top-models?month&segment=PV\|2W` | ranked models |
| `GET /dashboard/top-oems?month&segment=CV` | ranked OEMs |
| `GET /dashboard/financials?fy=2023` | revenue and net profit per OEM |
| `GET /dashboard/suppliers?page&limit` | paginated suppliers |
| `GET /dashboard/dealers` | dealer network sizes |
| `GET /dashboard/news?tag=Launches` | news by tab |

## Phase 5: frontend (built)

```bash
cd apps/web
cp .env.example .env.local     # points at http://localhost:4000
npm install
npm run dev                    # http://localhost:3000  (start the API first)
```

```
apps/web/src
  lib/          api.ts           fetch wrapper + JWT storage + response types
                format.ts        number / month / currency formatting
  app/          layout.tsx       root layout + React Query provider
                login/page.tsx   login form
                dashboard/page.tsx   the whole dashboard page
                globals.css      all styling
  components/   TopBar, Footer           shell
                StatCard                 one card, used 3x (production / sales / exports)
                RankedTable              top models + top OEMs (tabs + month picker)
                FinancialsTable, SupplierCarousel, DealersTable, NewsTabs
                Pct, MonthSelect         small shared pieces
```

### Learn it: frontend steps
1. **API client (`lib/api.ts`)**: one `api()` function adds the JWT header and redirects to
   `/login` on a 401. Types at the bottom mirror the API responses.
2. **Data fetching**: `useQuery` (TanStack Query) caches by `queryKey`. Changing a month changes the
   key, which triggers a refetch, and going back to a month you already viewed is instant.
3. **Reusable components**: `StatCard` renders any `Card`, so you write it once and use it three times.
   `RankedTable` takes an `endpoint` and `tabs`, so models and OEMs share it.
4. **Auth guard**: `dashboard/page.tsx` checks for a token in `useEffect` and redirects if missing.
   (Fine for learning. A production app would use cookies + middleware.)
5. **Empty and error states**: every section handles loading, error, and "No Data Reported".

## Phase 6: polish
Docker Compose (api + mongo + redis), tests for `previousMonth` and `pct`,
a CSV importer script, deploy to AWS.

## Legal note
Do not scrape or copy a commercial site's data, logo or branding. Use your own brand and
public or licensed data.
