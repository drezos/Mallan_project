import { Router, Request, Response } from 'express';
import { pool } from '../db/cache';

const router = Router();

const VALID_NORTH_STARS = ['brand_awareness', 'engagement', 'lead_generation', 'roas', 'traffic'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/onboarding/tenant?clerk_id={clerk_user_id}
router.get('/tenant', async (req: Request, res: Response) => {
  const { clerk_id } = req.query;

  if (!clerk_id) {
    return res.status(400).json({ error: 'clerk_id is required' });
  }

  try {
    const result = await pool.query(
      `SELECT tenant_id FROM users WHERE clerk_id = $1`,
      [clerk_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ tenant_id: result.rows[0].tenant_id });
  } catch (err) {
    console.error('Error fetching tenant by clerk_id:', err);
    return res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

// POST /api/onboarding/complete
router.post('/complete', async (req: Request, res: Response) => {
  const { tenant_id, company_name, website_url, selected_platforms, north_star } = req.body;

  if (!tenant_id || !UUID_REGEX.test(tenant_id)) {
    return res.status(400).json({ error: 'tenant_id is required and must be a valid UUID' });
  }

  if (!north_star || !VALID_NORTH_STARS.includes(north_star)) {
    return res.status(400).json({ error: `north_star must be one of: ${VALID_NORTH_STARS.join(', ')}` });
  }

  if (!Array.isArray(selected_platforms) || selected_platforms.length === 0) {
    return res.status(400).json({ error: 'selected_platforms must be a non-empty array' });
  }

  try {
    await pool.query(
      `UPDATE tenants
       SET brand_name = COALESCE($2, brand_name),
           brand_url = COALESCE($3, brand_url),
           north_star = $4,
           onboarding_complete = true,
           updated_at = NOW()
       WHERE id = $1`,
      [tenant_id, company_name || null, website_url || null, north_star]
    );

    await pool.query(
      `INSERT INTO tenant_settings (tenant_id, selected_platforms, onboarding_complete, updated_at)
       VALUES ($1, $2, true, NOW())
       ON CONFLICT (tenant_id) DO UPDATE
       SET selected_platforms = $2, onboarding_complete = true, updated_at = NOW()`,
      [tenant_id, JSON.stringify(selected_platforms)]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Error completing onboarding:', err);
    return res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// GET /api/onboarding/status?tenant_id={uuid}
router.get('/status', async (req: Request, res: Response) => {
  const { tenant_id } = req.query;

  if (!tenant_id) {
    return res.status(400).json({ error: 'tenant_id is required' });
  }

  try {
    const [connectionsResult, stakeholdersResult, settingsResult, tenantResult] = await Promise.all([
      pool.query(
        `SELECT platform FROM tenant_connections WHERE tenant_id = $1 AND access_token IS NOT NULL`,
        [tenant_id]
      ),
      pool.query(
        `SELECT COUNT(*) as count FROM tenant_stakeholders WHERE tenant_id = $1`,
        [tenant_id]
      ),
      pool.query(
        `SELECT onboarding_complete, selected_platforms FROM tenant_settings WHERE tenant_id = $1`,
        [tenant_id]
      ),
      pool.query(
        `SELECT brand_name, brand_url, north_star, onboarding_complete FROM tenants WHERE id = $1`,
        [tenant_id]
      ),
    ]);

    const connectedPlatforms = connectionsResult.rows.map((r: any) => r.platform);
    const hasStakeholders = parseInt(stakeholdersResult.rows[0].count, 10) > 0;
    const onboardingComplete =
      tenantResult.rows[0]?.onboarding_complete ?? settingsResult.rows[0]?.onboarding_complete ?? false;

    return res.json({
      onboarding_complete: onboardingComplete,
      company_name: tenantResult.rows[0]?.brand_name || null,
      website_url: tenantResult.rows[0]?.brand_url || null,
      selected_platforms: settingsResult.rows[0]?.selected_platforms || [],
      north_star: tenantResult.rows[0]?.north_star || null,
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
  const { tenant_id, brand_url, north_star_focus, selected_platforms } = req.body;

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

    await pool.query(
      `UPDATE tenant_settings
       SET north_star_focus = COALESCE($2, north_star_focus),
           selected_platforms = COALESCE($3, selected_platforms),
           onboarding_complete = TRUE,
           updated_at = NOW()
       WHERE tenant_id = $1`,
      [tenant_id, north_star_focus || null, selected_platforms ? JSON.stringify(selected_platforms) : null]
    );

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
      pool.query(`SELECT north_star_focus, selected_platforms FROM tenant_settings WHERE tenant_id = $1`, [tenant_id]),
    ]);

    return res.json({
      brand_url: tenantResult.rows[0]?.brand_url || null,
      north_star_focus: settingsResult.rows[0]?.north_star_focus || null,
      selected_platforms: settingsResult.rows[0]?.selected_platforms || [],
    });
  } catch (err) {
    console.error('Error fetching get-started data:', err);
    return res.status(500).json({ error: 'Failed to fetch get-started data' });
  }
});

export default router;
