import mysql from "mysql2/promise";
import { env } from "../config/env.js";

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.databaseHost,
      port: env.databasePort,
      user: env.databaseUser,
      password: env.databasePassword,
      database: env.databaseName,
      waitForConnections: true,
      connectionLimit: env.databaseConnectionLimit,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const pool = getPool();
  const [results] = await pool.execute(sql, params);
  return results;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
