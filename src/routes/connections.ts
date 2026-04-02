import { Router, Request, Response } from 'express';
import { pool } from '../db/cache';

const router = Router();

// GET /api/connections?tenant_id={uuid}
// Returns which platforms have tokens stored for the given tenant.
router.get('/', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT platform FROM tenant_connections WHERE tenant_id = $1 AND access_token IS NOT NULL`,
      [tenant_id]
    );

    const connectedPlatforms = result.rows.map((r: any) => r.platform);

    return res.json({
      google: connectedPlatforms.includes('google'),
      meta: connectedPlatforms.includes('meta'),
      linkedin: connectedPlatforms.includes('linkedin'),
    });
  } catch (err) {
    console.error('Error fetching connections:', err);
    return res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

export default router;
