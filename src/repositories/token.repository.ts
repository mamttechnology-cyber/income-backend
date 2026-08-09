import { pool } from "../config/database";

export const tokenRepository = {
  async storeRefreshToken(userId: number, tokenHash: string, expiresAt: Date) {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
      [userId, tokenHash, expiresAt]
    );
  },
  async findValidRefreshToken(userId: number, tokenHash: string) {
    const { rows } = await pool.query(
      `SELECT * FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND revoked = FALSE AND expires_at > now()`,
      [userId, tokenHash]
    );
    return rows[0] ?? null;
  },
  async revokeRefreshToken(tokenHash: string) {
    await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`, [tokenHash]);
  },
  async revokeAllForUser(userId: number) {
    await pool.query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);
  },

  async storeResetToken(userId: number, tokenHash: string, expiresAt: Date) {
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
      [userId, tokenHash, expiresAt]
    );
  },
  async findValidResetToken(tokenHash: string) {
    const { rows } = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used = FALSE AND expires_at > now()`,
      [tokenHash]
    );
    return rows[0] ?? null;
  },
  async markResetTokenUsed(resetId: number) {
    await pool.query(`UPDATE password_reset_tokens SET used = TRUE WHERE reset_id = $1`, [resetId]);
  },
};
