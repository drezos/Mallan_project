/**
 * User Competitors Routes
 *
 * API endpoints for managing user's competitor list
 */

import { Router, Request, Response } from 'express';
import { query } from '../db/migrations';

const router = Router();

const MAX_COMPETITORS = 10;

interface Competitor {
  id: number;
  name: string;
  url: string | null;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// GET /api/user/competitors - List all competitors
// =============================================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const competitors = await query<Competitor>(
      'SELECT id, name, url, created_at, updated_at FROM user_competitors ORDER BY created_at ASC'
    );

    res.json({
      success: true,
      data: {
        competitors,
        count: competitors.length,
        maxAllowed: MAX_COMPETITORS,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching competitors:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================================================
// POST /api/user/competitors - Add a new competitor
// =============================================================================

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, url } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Competitor name is required',
      });
    }

    // Check current count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM user_competitors'
    );
    const currentCount = parseInt(countResult[0].count, 10);

    if (currentCount >= MAX_COMPETITORS) {
      return res.status(400).json({
        success: false,
        error: `Maximum of ${MAX_COMPETITORS} competitors allowed`,
      });
    }

    // Check for duplicate name
    const existingResult = await query<{ id: number }>(
      'SELECT id FROM user_competitors WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (existingResult.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'A competitor with this name already exists',
      });
    }

    // Insert new competitor
    const result = await query<Competitor>(
      'INSERT INTO user_competitors (name, url) VALUES ($1, $2) RETURNING id, name, url, created_at, updated_at',
      [name.trim(), url?.trim() || null]
    );

    res.status(201).json({
      success: true,
      data: result[0],
    });
  } catch (error: any) {
    console.error('❌ Error adding competitor:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =============================================================================
// DELETE /api/user/competitors/:id - Remove a competitor
// =============================================================================

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const competitorId = parseInt(id, 10);

    if (isNaN(competitorId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid competitor ID',
      });
    }

    // Check if competitor exists
    const existingResult = await query<{ id: number }>(
      'SELECT id FROM user_competitors WHERE id = $1',
      [competitorId]
    );

    if (existingResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Competitor not found',
      });
    }

    // Delete competitor
    await query('DELETE FROM user_competitors WHERE id = $1', [competitorId]);

    res.json({
      success: true,
      message: 'Competitor deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deleting competitor:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
