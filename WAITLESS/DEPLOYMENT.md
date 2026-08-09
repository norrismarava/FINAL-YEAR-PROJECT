# WaitLess Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [WhatsApp Cloud API Setup](#whatsapp-cloud-api-setup)
7. [Offline Mode and Reconnect Testing](#offline-mode-and-reconnect-testing)
8. [Hybrid Deployment (Sync/Backup/Restore)](#hybrid-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** v18+ and npm
- **MySQL** 8.0+ (for production) or use file-based JSON storage (for development)
- **WhatsApp Business Platform** account (optional, for live notifications)
- **Static file hosting** for frontend (e.g., Netlify, Vercel, Nginx)

---

## Environment Configuration

### Backend `.env`

Create `WAITLESS/backend/.env`:

```env
# Server
PORT=4242
CORS_ORIGIN=*

# Public URL (for WhatsApp webhook)
PUBLIC_APP_URL=https://your-domain.com

# Database
DB_PROVIDER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=waitless
DB_USER=root
DB_PASSWORD=your-password
DB_SEED_DEMO_DATA=true

# Auth
AUTH_SESSION_TTL_MS=28800000

# Initial admin
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_EMAIL=admin@waitless.local
INITIAL_ADMIN_NAME=System Administrator
INITIAL_ADMIN_PASSWORD=change-me-immediately

# WhatsApp
WHATSAPP_PROVIDER=mock
WHATSAPP_API_BASE_URL=https://graph.facebook.com
WHATSAPP_API_VERSION=v23.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_TEMPLATE_LANGUAGE=en_US
WHATSAPP_TEMPLATE_QUEUE_REGISTERED=
WHATSAPP_TEMPLATE_QUEUE_READY_SOON=
WHATSAPP_TEMPLATE_QUEUE_CALLED=

# Runtime config (optional)
RUNTIME_CONFIG_PATH=data/runtime-config.json
```

### Frontend `.env`

Create `WAITLESS/frontend/.env`:

```env
VITE_API_URL=http://localhost:4242
```

For production, set `VITE_API_URL` to the deployed backend URL.

---

## Backend Deployment

### Development

```bash
cd WAITLESS/backend
npm install
npm run dev
```

The server starts on `http://localhost:4242`.

### Production

```bash
cd WAITLESS/backend
npm install --omit=dev
npm start
```

Use a process manager like **PM2** or **systemd** for production:

```bash
npm install -g pm2
pm2 start src/index.js --name waitless-backend
pm2 save
pm2 startup
```

---

## Frontend Deployment

### Build

```bash
cd WAITLESS/frontend
npm install
npm run build
```

Output is in `frontend/dist/`.

### Deploy

- **Netlify/Vercel**: Connect repo, set build command `npm run build`, publish directory `dist/`
- **Nginx**: Copy `dist/` to web root, configure SPA fallback:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/waitless/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Database Setup

### MySQL

1. Create database:
```sql
CREATE DATABASE waitless CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Run schema:
```bash
mysql -u root -p waitless < WAITLESS/backend/src/db/schema.sql
```

3. Set `DB_PROVIDER=mysql` in `.env`. Demo data seeds automatically if `DB_SEED_DEMO_DATA=true`.

### File-based (Development)

Set `DB_PROVIDER=file` in `.env`. Data is stored in `backend/data/queue-state.json`.

---

## WhatsApp Cloud API Setup

1. Go to [Meta for Developers](https://developers.facebook.com) and create a WhatsApp Business app
2. Add the WhatsApp Cloud API product
3. Get your **Phone Number ID** and **Access Token** from the dashboard
4. Create message templates:
   - `queue_registered` — sent when patient is registered
   - `queue_ready_soon` — sent when patient is 2-3 positions away
   - `queue_called` — sent when patient is called to service
5. Configure webhook:
   - **Callback URL**: `https://your-domain.com/api/integrations/whatsapp/webhook`
   - **Verify Token**: Set `WHATSAPP_WEBHOOK_VERIFY_TOKEN` to match
   - Subscribe to `messages` and `message_status` events
6. Set environment variables in `.env`:
   - `WHATSAPP_PROVIDER=meta-cloud`
   - `WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id`
   - `WHATSAPP_ACCESS_TOKEN=your-access-token`
   - `WHATSAPP_APP_SECRET=your-app-secret`
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token`
   - `WHATSAPP_TEMPLATE_QUEUE_REGISTERED=queue_registered`
   - `WHATSAPP_TEMPLATE_QUEUE_READY_SOON=queue_ready_soon`
   - `WHATSAPP_TEMPLATE_QUEUE_CALLED=queue_called`

7. Verify configuration via **Reports > WhatsApp Status** tab in the staff dashboard.

---

## Offline Mode and Reconnect Testing

The WaitLess frontend is designed to handle network interruptions gracefully. The following describes the offline behavior and how to test it.

### Real-time Connection States

The SSE (Server-Sent Events) connection has the following states:

| State | Description | UI Indicator |
|-------|-------------|--------------|
| `connected` | SSE stream active, receiving events | Green "Live sync" badge |
| `connecting` | Initial connection attempt | Blue "Connecting" badge |
| `reconnecting` | Connection lost, attempting reconnect | Gray "Reconnecting" badge |
| `polling` | SSE failed, fell back to periodic polling | Gray "Polling fallback" badge |
| `closed` | All connection methods failed | Gray "Offline" badge |

### Offline Behavior

- **Queue Board**: Continues showing last cached data. When reconnected, data refreshes automatically.
- **Dashboard**: Last-known metrics remain visible. A "Reconnecting" indicator appears.
- **Patient Tracking**: Shows cached ticket status. Refreshes on reconnect.
- **Department Display Boards**: Continue cycling last-known queue state. Auto-refreshes on reconnect.
- **Notifications**: If WhatsApp API is unreachable, notifications enter retry queue with delays of 15s, 60s, 300s.

### Reconnect Testing Procedure

1. **Simulate network loss**:
   - Open the application in a browser
   - Open DevTools > Network > Throttling > "Offline"
   - Verify the connection status indicator changes to "Offline" or "Reconnecting"
   - Verify the UI still shows last cached data without errors

2. **Simulate reconnect**:
   - Switch DevTools network back to "Online"
   - Verify the connection status returns to "Live sync" within 5 seconds
   - Verify all data refreshes automatically without manual page reload

3. **Test polling fallback**:
   - In DevTools, block `/api/events` endpoint only (not the whole network)
   - Verify the app falls back to polling mode
   - Verify data still updates at the configured interval (default 10s)

4. **Test SSE server restart**:
   - Stop the backend server while the frontend is open
   - Verify "Reconnecting" status appears
   - Restart the backend server
   - Verify automatic reconnection within 5-10 seconds

5. **Test notification retry**:
   - Temporarily set `WHATSAPP_PROVIDER=mock` and `WHATSAPP_MOCK_FAILURE_RATE=1.0`
   - Register a patient with notifications enabled
   - Verify notification enters retry queue
   - Reset `WHATSAPP_MOCK_FAILURE_RATE=0` and trigger retry from dashboard
   - Verify notification delivers successfully

### Settings for Offline Resilience

Configure in **Settings** page:
- **Enable live sync**: Toggle SSE on/off
- **Auto refresh interval**: Polling interval (2-30 seconds)
- **Polling fallback**: Auto-fallback when SSE unavailable

---

## Hybrid Deployment

For environments with intermittent connectivity (e.g., hospital with limited internet), WaitLess supports a hybrid deployment model.

### Architecture

- **Local server**: Runs on hospital intranet with file-based or local MySQL storage
- **Cloud sync**: Periodic sync to cloud backup for data persistence
- **Backup/Restore**: JSON export/import of queue state

### Sync Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sync/export` | Export full queue state as JSON |
| `POST` | `/api/sync/import` | Import queue state from JSON |
| `GET` | `/api/sync/status` | Check sync status and last sync timestamp |
| `POST` | `/api/sync/backup` | Create a timestamped backup file |

See `DEPLOYMENT.md` section on Hybrid Deployment for detailed setup instructions.

---

## Troubleshooting

### Port already in use
```
Error: EADDRINUSE - Port 4242 is already in use
```
Solution: Stop the existing process or change `PORT` in `.env`.

### Database connection failed
Verify `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `.env`. Test with:
```bash
mysql -u root -p -h 127.0.0.1 -P 3306
```

### WhatsApp notifications not sending
1. Check **Reports > WhatsApp Status** for configuration issues
2. Verify `WHATSAPP_PROVIDER=meta-cloud` (not `mock`)
3. Verify `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set
4. Check webhook verification in Meta Business Manager
5. Verify message templates are approved

### Frontend API connection failed
1. Verify `VITE_API_URL` points to the correct backend URL
2. Check CORS settings: `CORS_ORIGIN` in backend `.env`
3. Verify backend is running and accessible

### SSE connection drops frequently
1. Check network stability
2. Increase `autoRefreshIntervalSec` in Settings
3. Ensure polling fallback is enabled
4. Check if proxy/load balancer has SSE timeout settings (should be 60s+)
