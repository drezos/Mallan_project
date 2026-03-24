import { Router, Request, Response } from 'express';
import { pool } from '../db/cache';

const router = Router();

// GET /api/onboarding/status?tenant_id={uuid}
router.get('/status', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const [connectionsResult, stakeholdersResult, settingsResult] = await Promise.all([
      pool.query(
        `SELECT platform FROM tenant_connections WHERE tenant_id = $1 AND access_token IS NOT NULL`,
        [tenant_id]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM tenant_stakeholders WHERE tenant_id = $1`,
        [tenant_id]
      ),
      pool.query(
        `SELECT onboarding_complete FROM tenant_settings WHERE tenant_id = $1`,
        [tenant_id]
      ),
    ]);

    const connectedPlatforms = connectionsResult.rows.map((r: any) => r.platform);
    const hasStakeholders = parseInt(stakeholdersResult.rows[0].count, 10) > 0;
    const onboardingComplete = settingsResult.rows[0]?.onboarding_complete ?? false;

    return res.json({
      onboarding_complete: onboardingComplete,
      connections: {
        google: connectedPlatforms.includes('google'),
        meta: connectedPlatforms.includes('meta'),
        linkedin: connectedPlatforms.includes('linkedin'),
      },
      has_stakeholders: hasStakeholders,
      has_schedule: onboardingComplete,
    });
  } catch (err) {
    console.error('Error fetching onboarding status:', err);
    return res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

// GET /api/onboarding/defaults
router.get('/defaults', (_req: Request, res: Response) => {
  return res.json({
    stakeholder_templates: [
      {
        name: 'Finance Director',
        view_type: 'finance',
        metrics_visible: ['total_spend', 'budget_pct', 'cpa', 'conversions'],
      },
      {
        name: 'CEO / Management',
        view_type: 'management',
        metrics_visible: ['roas', 'total_leads', 'cac_trend', 'top_channel', 'channel_breakdown'],
      },
      {
        name: 'Marketing (Self)',
        view_type: 'internal',
        metrics_visible: ['all'],
      },
    ],
  });
});

// POST /api/onboarding/stakeholders
router.post('/stakeholders', async (req: Request, res: Response) => {
  const { tenant_id, stakeholders } = req.body;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  if (!Array.isArray(stakeholders)) {
    return res.status(400).json({ error: 'stakeholders must be an array' });
  }

  try {
    // Delete existing stakeholders for full replace
    await pool.query(`DELETE FROM tenant_stakeholders WHERE tenant_id = $1`, [tenant_id]);

    if (stakeholders.length === 0) {
      return res.json([]);
    }

    const inserted: any[] = [];
    for (const s of stakeholders) {
      const result = await pool.query(
        `INSERT INTO tenant_stakeholders (tenant_id, name, email, view_type, metrics_visible)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          tenant_id,
          s.name,
          s.email || null,
          s.view_type || 'internal',
          JSON.stringify(s.metrics_visible || []),
        ]
      );
      inserted.push(result.rows[0]);
    }

    return res.json(inserted);
  } catch (err) {
    console.error('Error saving stakeholders:', err);
    return res.status(500).json({ error: 'Failed to save stakeholders' });
  }
});

// GET /api/onboarding/stakeholders?tenant_id={uuid}
router.get('/stakeholders', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM tenant_stakeholders WHERE tenant_id = $1 ORDER BY created_at ASC`,
      [tenant_id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Error fetching stakeholders:', err);
    return res.status(500).json({ error: 'Failed to fetch stakeholders' });
  }
});

// POST /api/onboarding/schedule
router.post('/schedule', async (req: Request, res: Response) => {
  const { tenant_id, report_frequency, report_day, report_time } = req.body;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE tenant_settings
       SET report_frequency = $2,
           report_day = $3,
           report_time = $4,
           onboarding_complete = TRUE,
           updated_at = NOW()
       WHERE tenant_id = $1
       RETURNING *`,
      [tenant_id, report_frequency, report_day, report_time]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant settings not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving schedule:', err);
    return res.status(500).json({ error: 'Failed to save schedule' });
  }
});

// GET /api/onboarding/schedule?tenant_id={uuid}
router.get('/schedule', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM tenant_settings WHERE tenant_id = $1`,
      [tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant settings not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching schedule:', err);
    return res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// POST /api/onboarding/get-started
router.post('/get-started', async (req: Request, res: Response) => {
  const { tenant_id, brand_url, north_star_focus } = req.body;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  const validOptions = ['brand_awareness', 'engagement', 'lead_generation', 'drive_sales'];
  if (north_star_focus && !validOptions.includes(north_star_focus)) {
    return res.status(400).json({ error: 'Invalid north_star_focus value' });
  }

  try {
    if (brand_url) {
      await pool.query(
        `UPDATE tenants SET brand_url = $2, updated_at = NOW() WHERE id = $1`,
        [tenant_id, brand_url]
      );
    }

    if (north_star_focus) {
      await pool.query(
        `UPDATE tenant_settings SET north_star_focus = $2, updated_at = NOW() WHERE tenant_id = $1`,
        [tenant_id, north_star_focus]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving get-started data:', err);
    return res.status(500).json({ error: 'Failed to save get-started data' });
  }
});

// GET /api/onboarding/get-started?tenant_id={uuid}
router.get('/get-started', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const [tenantResult, settingsResult] = await Promise.all([
      pool.query(`SELECT brand_url FROM tenants WHERE id = $1`, [tenant_id]),
      pool.query(`SELECT north_star_focus FROM tenant_settings WHERE tenant_id = $1`, [tenant_id]),
    ]);

    return res.json({
      brand_url: tenantResult.rows[0]?.brand_url || null,
      north_star_focus: settingsResult.rows[0]?.north_star_focus || null,
    });
  } catch (err) {
    console.error('Error fetching get-started data:', err);
    return res.status(500).json({ error: 'Failed to fetch get-started data' });
  }
});

export default router;
