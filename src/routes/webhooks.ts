import { Router, Request, Response } from 'express';
import express from 'express';
import { Webhook } from 'svix';
import { pool } from '../db/cache';

const router = Router();

// Use raw body parser for Clerk webhook signature verification
router.post('/clerk', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
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

  const wh = new Webhook(secret);
  let event: any;

  try {
    event = wh.verify(req.body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  if (event.type === 'user.created') {
    const { id: clerkId, email_addresses } = event.data;
    const email = email_addresses?.[0]?.email_address;

    const resolvedEmail = email ?? 'unknown@weeklybrew.io';
    if (!email) {
      console.warn(`No email found for Clerk user ${clerkId}, using fallback: ${resolvedEmail}`);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tenantResult = await client.query(
        `INSERT INTO tenants (id, name, brand_name, brand_url, region_code, region_name)
         VALUES (gen_random_uuid(), $1, '', '', 0, '')
         RETURNING id`,
        [resolvedEmail]
      );
      const tenantId = tenantResult.rows[0].id;

      await client.query(
        `INSERT INTO users (email, clerk_id, tenant_id)
         VALUES ($1, $2, $3)`,
        [resolvedEmail, clerkId, tenantId]
      );

      await client.query(
        `INSERT INTO tenant_settings (tenant_id) VALUES ($1)`,
        [tenantId]
      );

      await client.query('COMMIT');

      console.log(`✅ Created tenant and user for Clerk user ${clerkId} (${resolvedEmail})`);
      return res.status(200).json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating tenant/user for Clerk webhook:', err);
      return res.status(500).json({ error: 'Failed to create tenant and user' });
    } finally {
      client.release();
    }
  }

  // Acknowledge all other event types
  return res.status(200).json({ received: true });
});

export default router;
