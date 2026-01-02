/**
 * Tenant Routes
 *
 * API endpoints for tenant onboarding and management
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db/cache';

const router = Router();

// Types for request body
interface Competitor {
  name: string;
  url: string;
  keywords: string[];
}

interface MarketKeyword {
  keyword: string;
  category: 'comparison' | 'problem' | 'product' | 'regulation' | 'review';
}

interface CreateTenantRequest {
  brandName: string;
  brandUrl: string;
  regionCode: number;
  regionName: string;
  brandKeywords: string[];
  competitors: Competitor[];
  marketKeywords: MarketKeyword[];
}

// =============================================================================
// POST /api/tenants/create - Create a new tenant from onboarding form
// =============================================================================

router.post('/create', async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const {
      brandName,
      brandUrl,
      regionCode,
      regionName,
      brandKeywords,
      competitors,
      marketKeywords
    }: CreateTenantRequest = req.body;

    // Validate required fields
    if (!brandName || !brandUrl || !regionCode || !regionName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: brandName, brandUrl, regionCode, regionName'
      });
    }

    console.log(`🏢 Creating new tenant: ${brandName}`);

    // Start transaction
    await client.query('BEGIN');

    // 1. Create tenant
    const tenantResult = await client.query(
      `INSERT INTO tenants (name, brand_name, brand_url, region_code, region_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [brandName, brandName, brandUrl, regionCode, regionName]
    );
    const tenantId = tenantResult.rows[0].id;

    console.log(`  ✅ Created tenant with ID: ${tenantId}`);

    // 2. Create brand keywords
    let brandKeywordCount = 0;
    if (brandKeywords && brandKeywords.length > 0) {
      for (const keyword of brandKeywords) {
        await client.query(
          `INSERT INTO tenant_brand_keywords (tenant_id, keyword)
           VALUES ($1, $2)`,
          [tenantId, keyword]
        );
        brandKeywordCount++;
      }
    }

    console.log(`  ✅ Added ${brandKeywordCount} brand keywords`);

    // 3. Create competitors and their keywords
    let competitorCount = 0;
    let competitorKeywordCount = 0;
    if (competitors && competitors.length > 0) {
      for (const competitor of competitors) {
        // Insert competitor
        const competitorResult = await client.query(
          `INSERT INTO tenant_competitors (tenant_id, name, url)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [tenantId, competitor.name, competitor.url]
        );
        const competitorId = competitorResult.rows[0].id;
        competitorCount++;

        // Insert competitor keywords
        if (competitor.keywords && competitor.keywords.length > 0) {
          for (const keyword of competitor.keywords) {
            await client.query(
              `INSERT INTO tenant_competitor_keywords (tenant_id, competitor_id, keyword)
               VALUES ($1, $2, $3)`,
              [tenantId, competitorId, keyword]
            );
            competitorKeywordCount++;
          }
        }
      }
    }

    console.log(`  ✅ Added ${competitorCount} competitors with ${competitorKeywordCount} keywords`);

    // 4. Create market keywords
    let marketKeywordCount = 0;
    if (marketKeywords && marketKeywords.length > 0) {
      for (const mk of marketKeywords) {
        await client.query(
          `INSERT INTO tenant_market_keywords (tenant_id, keyword, category)
           VALUES ($1, $2, $3)`,
          [tenantId, mk.keyword, mk.category]
        );
        marketKeywordCount++;
      }
    }

    console.log(`  ✅ Added ${marketKeywordCount} market keywords`);

    // Commit transaction
    await client.query('COMMIT');

    console.log(`✅ Tenant ${brandName} created successfully`);

    res.status(201).json({
      success: true,
      tenantId
    });
  } catch (error: any) {
    // Rollback transaction on error
    await client.query('ROLLBACK');

    console.error('❌ Error creating tenant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    client.release();
  }
});

// =============================================================================
// GET /api/tenants/:id - Get tenant info with keyword counts
// =============================================================================

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get tenant info
    const tenantResult = await pool.query(
      `SELECT id, name, brand_name, brand_url, region_code, region_name, created_at, updated_at
       FROM tenants WHERE id = $1`,
      [id]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];

    // Get keyword counts
    const brandKeywordsResult = await pool.query(
      `SELECT COUNT(*) as count FROM tenant_brand_keywords WHERE tenant_id = $1`,
      [id]
    );

    const competitorsResult = await pool.query(
      `SELECT COUNT(*) as count FROM tenant_competitors WHERE tenant_id = $1`,
      [id]
    );

    const competitorKeywordsResult = await pool.query(
      `SELECT COUNT(*) as count FROM tenant_competitor_keywords WHERE tenant_id = $1`,
      [id]
    );

    const marketKeywordsResult = await pool.query(
      `SELECT COUNT(*) as count FROM tenant_market_keywords WHERE tenant_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          brandName: tenant.brand_name,
          brandUrl: tenant.brand_url,
          regionCode: tenant.region_code,
          regionName: tenant.region_name,
          createdAt: tenant.created_at,
          updatedAt: tenant.updated_at
        },
        counts: {
          brandKeywords: parseInt(brandKeywordsResult.rows[0].count, 10),
          competitors: parseInt(competitorsResult.rows[0].count, 10),
          competitorKeywords: parseInt(competitorKeywordsResult.rows[0].count, 10),
          marketKeywords: parseInt(marketKeywordsResult.rows[0].count, 10)
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching tenant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
