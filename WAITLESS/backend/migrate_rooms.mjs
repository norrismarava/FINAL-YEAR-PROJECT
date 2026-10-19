import { query, closePool } from "./src/db/db.js";

const migrations = [
  {
    table: "staff_users",
    column: "room_number",
    ddl: "ALTER TABLE staff_users ADD COLUMN room_number VARCHAR(20) NULL",
  },
  {
    table: "tickets",
    column: "called_by",
    ddl: "ALTER TABLE tickets ADD COLUMN called_by VARCHAR(160) NULL",
  },
  {
    table: "tickets",
    column: "called_room",
    ddl: "ALTER TABLE tickets ADD COLUMN called_room VARCHAR(40) NULL",
  },
];

async function columnExists(table, column) {
  const rows = await query(
    `SELECT COUNT(*) AS count
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

try {
  for (const migration of migrations) {
    if (await columnExists(migration.table, migration.column)) {
      console.log(`skip  ${migration.table}.${migration.column} (exists)`);
      continue;
    }
    await query(migration.ddl);
    console.log(`added ${migration.table}.${migration.column}`);
  }
  console.log("done");
} catch (error) {
  console.error("migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
