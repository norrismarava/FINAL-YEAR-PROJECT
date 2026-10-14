# WaitLess — dev notes

## Stack & ports
- Frontend: Vite + React on port **3000** (`frontend/`)
- Backend: Node/Express on port **4242** (`backend/`)
- API proxy: `frontend/vite.config.js` proxies `/api` → `http://localhost:4242` (override with `VITE_PROXY_TARGET`)
- DB: MySQL via **XAMPP** — the backend server stays up even when MySQL is down, so **5xx / "internal server error" on login or registration = check XAMPP MySQL first**

## Verify
- `cd frontend && npm run build` — full build
- `npx eslint <file>` — lint
- `curl http://localhost:4242/api/health` — backend up; `curl http://localhost:3000/api/health` — proxy OK

## Gotchas
- `public/sw.js` is a service worker with stale-while-revalidate caching — it can serve old assets/modules in dev. Bump `CACHE_NAME` after changing logo/public assets if stale content appears.
- Key routes: `/admin/login` (staff), `/patient/login` (patient), staff workspace under `/admin/*`
- `patient-login` posts to `/api/patient/auth/login`; staff login posts to `/api/auth/login`
