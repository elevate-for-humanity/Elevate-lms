/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Admin Approval Management Routes for Pay Backend
// Add this to your existing Pay service routes

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
export const approvalsAdmin = Router();

/**
 * List all approvals with optional filters
 * GET /api/approvals/list?q=search&status=pending
 * Returns: Array of approval records
 */
approvalsAdmin.get('/api/approvals/list', async (req, res) => {
  try {
    const { q = '', status = '' } = req.query;

    let qb = supa
      .from('case_manager_approvals')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      qb = qb.eq('status', status);
    }

    const { data, error } = await qb;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Client-side filtering for search
    const needle = q.toLowerCase();
    const filtered = needle
      ? (data || []).filter(
          (r) =>
            (r.student_email || '').toLowerCase().includes(needle) ||
            (r.program_slug || '').toLowerCase().includes(needle) ||
            (r.voucher_id || '').toLowerCase().includes(needle) ||
            (r.case_manager_email || '').toLowerCase().includes(needle),
        )
      : data;

    res.json(filtered || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Admin manual decision (no email token), for admins only
 * POST /api/approvals/admin_decide
 * Body: { id, decision: 'approved'|'declined' }
 */
approvalsAdmin.post('/api/approvals/admin_decide', async (req, res) => {
  try {
    const { id, decision } = req.body || {};

    if (!id || !['approved', 'declined'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Load record
    const { data: rec, error } = await supa
      .from('case_manager_approvals')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !rec) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    if (rec.status !== 'pending') {
      return res.status(400).json({ error: 'Already decided' });
    }

    // Update status
    await supa
      .from('case_manager_approvals')
      .update({
        status: decision,
        decided_at: new Date().toISOString(),
      })
      .eq('id', id);

    // On approve → mark enrollment active
    if (decision === 'approved') {
      const { data: appUser } = await supa
        .from('app_users')
        .select('id')
        .eq('email', rec.student_email)
        .single();

      if (appUser) {
        await supa.from('enrollments').upsert(
          {
            user_id: appUser.id,
            program_slug: rec.program_slug,
            status: 'active',
            started_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,program_slug',
          },
        );

        await supa.from('notes').insert({
          user_id: appUser.id,
          type: 'admin',
          content: JSON.stringify({
            action: 'admin_approval',
            voucher_id: rec.voucher_id,
            funding_source: rec.funding_source,
            case_manager: rec.case_manager_email,
            decided_by: 'admin_dashboard',
          }),
          created_at: new Date().toISOString(),
        });
      }
    }

    res.json({ ok: true, decision });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get approval stats for dashboard
 * GET /api/approvals/stats
 */
approvalsAdmin.get('/api/approvals/stats', async (req, res) => {
  try {
    const { data } = await supa.from('case_manager_approvals').select('status');

    const counts = (data || []).reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      pending: counts.pending || 0,
      approved: counts.approved || 0,
      declined: counts.declined || 0,
      total: data?.length || 0,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export for integration with main server
export { approvalsAdmin };
