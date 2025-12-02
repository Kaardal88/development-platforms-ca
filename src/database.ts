import mySql2, { Pool } from "mysql2/promise";
import "dotenv/config";

const pool: Pool = mySql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
export { pool };
