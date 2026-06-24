# Backend Structure

The backend exposes the queue, triage, tracking, notification, dashboard, and
realtime APIs for WaitLess.

## Data Storage

The repository layer supports two storage providers:

- `DB_PROVIDER=file` keeps the current local development/demo JSON store.
- `DB_PROVIDER=mysql` uses the MySQL schema in `src/db/schema.sql`.

For a hospital deployment, create a MySQL database and set the database values in
`.env`:

```env
DB_PROVIDER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=waitless
DB_USER=waitless
DB_PASSWORD=change-me
DB_SEED_DEMO_DATA=false
```

The backend applies the schema on startup and seeds demo tickets only when
`DB_SEED_DEMO_DATA=true`.

## Folders

Recommended responsibilities:

- `modules/`: feature-focused backend domains
- `controllers/`: HTTP request handlers
- `services/`: business logic
- `repositories/`: database access and storage adapters
- `middleware/`: auth, validation, logging, guards
- `sockets/`: realtime events
- `utils/`: shared server helpers
- `config/`: environment and app configuration
