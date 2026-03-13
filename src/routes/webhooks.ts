import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import express from 'express';
import { pool } from '../db/migrations';

const router = Router();

/**
 * Verifies a Clerk webhook signature using HMAC-SHA256.
 * Clerk signs webhooks with svix: signature = HMAC-SHA256(id.timestamp.body, secret)
 */
function verifyClerkWebhook(
  rawBody: Buffer,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  // Reject if timestamp is older than 5 minutes (replay attack prevention)
  const timestampMs = parseInt(svixTimestamp, 10) * 1000;
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  // Decode the secret: strip 'whsec_' prefix then base64-decode
  const signingKey = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');

  const toSign = `${svixId}.${svixTimestamp}.${rawBody.toString()}`;
  const computedSignature = crypto
    .createHmac('sha256', signingKey)
    .update(toSign)
    .digest('base64');

  // svix-signature may contain multiple space-separated "v1,<base64>" values
  const signatures = svixSignature
    .split(' ')
    .map(s => s.split(',')[1])
    .filter(Boolean);

  return signatures.some(sig => sig === computedSignature);
}

// POST /api/webhooks/clerk
router.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      console.error('CLERK_WEBHOOK_SECRET is not set');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    const rawBody = req.body as Buffer;

    if (!verifyClerkWebhook(rawBody, svixId, svixTimestamp, svixSignature, secret)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody.toString());
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    if (event.type === 'user.created') {
      const { id: clerkId, email_addresses } = event.data;
      const email: string = email_addresses?.[0]?.email_address ?? '';

      try {
        const tenantResult = await pool.query(
          `INSERT INTO tenants (name, brand_name, brand_url, region_code, region_name)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [email, '', '', 0, '']
        );
        const tenantId: string = tenantResult.rows[0].id;

        await pool.query(
          `INSERT INTO users (clerk_id, tenant_id) VALUES ($1, $2)`,
          [clerkId, tenantId]
        );

        console.log(`✅ Clerk webhook: created tenant ${tenantId} and user for ${email}`);
      } catch (error) {
        console.error('❌ Clerk webhook: failed to create tenant/user:', error);
        return res.status(500).json({ error: 'Failed to create tenant and user' });
      }
    }

    res.status(200).json({ received: true });
  }
);

export default router;
