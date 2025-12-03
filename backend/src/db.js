import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("render") 
    ? { rejectUnauthorized: false }
    : false
});

pool.on("connect", () => {
  console.log("DB conectada a PostgreSQL");
});
