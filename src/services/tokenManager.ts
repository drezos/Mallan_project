import { pool } from '../db/cache';

const TOKEN_REFRESH_URL = 'https://oauth2.googleapis.com/token';
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export async function getValidAccessToken(tenantId: string, platform: string): Promise<string> {
  const result = await pool.query(
    `SELECT access_token, refresh_token, expires_at
     FROM tenant_connections
     WHERE tenant_id = $1 AND platform = $2`,
    [tenantId, platform]
  );

  if (result.rows.length === 0) {
    throw new Error(`No ${platform} connection found for tenant ${tenantId}`);
  }

  const { access_token, refresh_token, expires_at } = result.rows[0];

  const isValid = expires_at && new Date(expires_at).getTime() > Date.now() + EXPIRY_BUFFER_MS;
  if (isValid) {
    return access_token;
  }

  if (!refresh_token) {
    throw new Error(`Access token expired and no refresh token available for tenant ${tenantId}`);
  }

  const response = await fetch(TOKEN_REFRESH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Google token for tenant ${tenantId}: ${error}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000);

  await pool.query(
    `UPDATE tenant_connections
     SET access_token = $1, expires_at = $2
     WHERE tenant_id = $3 AND platform = $4`,
    [data.access_token, newExpiresAt, tenantId, platform]
  );

  return data.access_token;
}
