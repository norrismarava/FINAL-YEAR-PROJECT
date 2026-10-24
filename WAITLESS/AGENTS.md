# WaitLess — dev notes

## Stack & ports
- Frontend: Vite + React on port **3000** (`frontend/`)
- Backend: Node HTTP server on port **4242** (`backend/`, `PORT` in `.env`; Express is installed but the API uses a custom router)
- API proxy: `frontend/vite.config.js` proxies `/api` → `VITE_PROXY_TARGET` > `backend/.env` `PORT` > `http://localhost:4242` — each machine follows its own backend port automatically
- DB: MySQL via **XAMPP** — the backend server stays up even when MySQL is down, so **5xx / "internal server error" on login or registration = check XAMPP MySQL first**

## Verify
- `cd frontend && npm run build` — full build
- `npx eslint <file>` — lint
- `curl http://localhost:4242/api/health` — backend up; `curl http://localhost:3000/api/health` — proxy OK

## Gotchas
- `public/sw.js` is a service worker with stale-while-revalidate caching — it can serve old assets/modules in dev. Bump `CACHE_NAME` after changing logo/public assets if stale content appears.
- Key routes: `/admin/login` (staff), `/patient/login` (patient), staff workspace under `/admin/*`
- `patient-login` posts to `/api/patient/auth/login`; staff login posts to `/api/auth/login`

## Deploy (Render)
- `render.yaml` (repo root) is a Blueprint: `waitless-api` (Node web service, `WAITLESS/backend`) + `waitless` (static site, `WAITLESS/frontend` → `dist`)
- Render: **New > Blueprint** > pick this repo; fill `sync: false` env vars from `backend/.env` (DB creds, `INITIAL_ADMIN_PASSWORD` — bootstrap-only, used only if the DB has no admin)
- Frontend build var: `VITE_API_BASE_URL` must be the backend's public URL — it replaces the same-origin `/api` proxy in production
- Backend env: `CORS_ORIGIN` = the frontend's URL, `TRUST_PROXY=true`, `PUBLIC_APP_URL` = frontend URL
- If the Render service names are taken, hostnames differ — update `CORS_ORIGIN`, `PUBLIC_APP_URL`, `VITE_API_BASE_URL` to match
- Free-tier caveats: web service sleeps after ~15 min idle (first request after sleep takes ~30–60 s) and the filesystem is ephemeral — `data/sessions.json` does not survive restarts/redeploys
