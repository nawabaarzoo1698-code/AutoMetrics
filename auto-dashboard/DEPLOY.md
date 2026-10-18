# Run locally, then host a live demo

## A. Run locally (about 10 minutes)

1. Install Node 20+ and Docker.
2. Start the databases and API:
   ```bash
   docker compose up -d mongo redis
   cd apps/api && cp .env.example .env && npm install
   npm run seed          # fake data + demo@example.com / demo1234
   npm run dev           # http://localhost:4000/health
   ```
3. Start the frontend in a second terminal:
   ```bash
   cd apps/web && cp .env.example .env.local && npm install
   npm run dev           # http://localhost:3000
   ```
4. Sign in with the prefilled demo account.

## B. Host it free

Use three free services. Total time is about 30 minutes.

| Part | Service | Why |
|---|---|---|
| Database | MongoDB Atlas (M0 free) | Hosted Mongo |
| Cache | Upstash Redis (free) | Optional, the API works without it |
| API | Render (free web service) | Runs the Dockerfile |
| Frontend | Vercel (free) | Best fit for Next.js |

### 1. Database
- Create an Atlas M0 cluster and a database user. Under Network Access, allow `0.0.0.0/0` for the demo.
- Copy the connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/auto_dashboard`.
- Seed it from your laptop:
  ```bash
  cd apps/api
  MONGO_URI="<atlas string>" npm run seed
  ```

### 2. API on Render
- Push the repo to GitHub, then in Render choose New > Web Service, root directory `apps/api`, runtime Docker.
- Environment variables:
  - `MONGO_URI` = the Atlas string
  - `JWT_SECRET` = a long random string (`openssl rand -hex 32`)
  - `REDIS_URL` = the Upstash URL (skip if you don't use Redis)
  - `CORS_ORIGIN` = your Vercel URL (set this after step 3)
- Check `https://<your-api>.onrender.com/health` returns `{"ok":true}`. The free tier sleeps after idle, so the first request takes about 30 seconds. Open it before a demo.

### 3. Frontend on Vercel
- Import the same repo, root directory `apps/web`.
- Environment variable: `NEXT_PUBLIC_API_URL` = your Render API URL.
- Deploy, then go back to Render and set `CORS_ORIGIN` to the Vercel URL.

### 4. Before you share the link
- Change the demo password or remove the prefilled credentials in `login/page.tsx` if the link is public.
- Keep the data labeled as sample data.

## C. What to show in the demo
1. Login, then the JWT in the browser network tab.
2. Change a month on a card, then show the `/dashboard/summary?month=` request.
3. Redis: first request is slow, second is instant (add a log line in `cache.ts`).
4. Open `buildSummaryCard` and walk through how the % change is computed.
