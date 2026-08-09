/**
 * Run with: npm run seed  (from backend/)
 * Creates the development SUPER_ADMIN using bcrypt hashed at runtime,
 * so no password hash is ever hardcoded in source control or SQL files.
 */
import { pool } from "../config/database";
import { hashPassword } from "../utils/password";
import { env } from "../config/env";

async function seed() {
  const { rows: roleRows } = await pool.query(`SELECT role_id FROM roles WHERE role_name = $1`, ["SUPER_ADMIN"]);
  if (roleRows.length === 0) {
    console.error("SUPER_ADMIN role not found. Run database/full_schema.sql first.");
    process.exit(1);
  }
  const roleId = roleRows[0].role_id;

  const { rows: existing } = await pool.query(`SELECT user_id FROM users WHERE email = $1`, [env.seedSuperAdminEmail]);
  if (existing.length > 0) {
    console.log(`Super admin ${env.seedSuperAdminEmail} already exists. Nothing to do.`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(env.seedSuperAdminPassword);
  await pool.query(
    `INSERT INTO users (org_id, role_id, first_name, last_name, email, password_hash, status)
     VALUES (NULL, $1, 'Super', 'Admin', $2, $3, 'ACTIVE')`,
    [roleId, env.seedSuperAdminEmail, passwordHash]
  );

  console.log("Development SUPER_ADMIN created:");
  console.log(`  Email:    ${env.seedSuperAdminEmail}`);
  console.log(`  Password: ${env.seedSuperAdminPassword}`);
  console.log("Change this password after first login.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
