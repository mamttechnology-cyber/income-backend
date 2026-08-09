/// <reference path="./types/express.d.ts" />
import app from "./app";
import { env } from "./config/env";
import { pool } from "./config/database";

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL");
  } catch (err) {
    console.error("Failed to connect to PostgreSQL. Check DATABASE_URL in backend/.env");
    console.error(err);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

start();
