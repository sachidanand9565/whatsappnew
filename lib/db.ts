import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    throw new Error('Missing required database environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  }
  return mysql.createPool({
    host:               process.env.DB_HOST,
    port:               Number(process.env.DB_PORT) || 3306,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    database:           process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit:    5,
    queueLimit:         0,
    charset:            'utf8mb4',
    timezone:           'Z',
    dateStrings:        true,
  });
}

// Lazy singleton — pool is created only on the first actual query, not at import time.
// This prevents Vercel build failures when DB env vars are not present during static analysis.
function getPool(): mysql.Pool {
  if (!global._mysqlPool) {
    global._mysqlPool = createPool();
    try {
      const { startCronRunner } = require('./cronRunner');
      startCronRunner();
    } catch (e) {
      console.error('Failed to start background cron resumer:', e);
    }
  }
  return global._mysqlPool;
}

// ---- helper: run a query and return rows typed as T ----
export async function query<T = mysql.RowDataPacket[]>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T;
}

// ---- helper: run INSERT and return insertId ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insert(sql: string, params?: any[]): Promise<number> {
  const [result] = await getPool().execute(sql, params);
  return (result as mysql.ResultSetHeader).insertId;
}

// ---- helper: run UPDATE/DELETE and return affectedRows ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function execute(sql: string, params?: any[]): Promise<number> {
  const [result] = await getPool().execute(sql, params);
  return (result as mysql.ResultSetHeader).affectedRows;
}
