/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Case Manager Approval Routes Integration for simple-server.cjs
// CommonJS version to integrate with the main server

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Initialize Supabase client (using environment variables)
function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
      'Supabase credentials not configured - approval system will be disabled'
    );
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

const supa = createSupabaseClient();
const SECRET =
  process.env.APPROVAL_SECRET ||
  process.env.JWT_SECRET ||
  'efh-default-secret-change-in-production';
const BASE = process.env.APPROVAL_BASE_URL || 'http://localhost:5000/approvals';

/**
 * Helper function to handle approval decision (approve/decline)
 */
async function handleDecision(req, res, decision) {
  try {
    if (!supa) {
      return res
        .status(500)
        .send('Approval system not configured - missing Supabase credentials');
    }

    const token = String(req.query.token || '');
    if (!token) {
      return res.status(400).send('Missing approval token');
    }

    const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');

    // Find pending record
    const { data: rec } = await supa
      .from('case_manager_approvals')
      .select('*')
      .eq('token_hash', token_hash)
      .eq('status', 'pending')
      .single();

    if (!rec) {
      return res
        .status(400)
        .send('This approval link is invalid or already used.');
    }

    // Mark decided
    await supa
      .from('case_manager_approvals')
      .update({
        status: decision,
        decided_at: new Date().toISOString(),
      })
      .eq('id', rec.id);

    if (decision === 'approved') {
      // Mark enrollment active in Supabase (no payment required)
      await markEnrollmentActive({
        student_email: payload.student_email,
        program_slug: payload.program_slug,
      });

      // Add funding note
      await addFundingNote(payload.student_email, {
        voucher_id: payload.voucher_id || null,
        funding_source: payload.funding_source || null,
        approved_by: payload.case_manager_email,
        approval_method: 'case_manager_email',
      });

      return res.send(`
        <h1>✅ Enrollment Approved</h1>
        <p>Student <strong>${payload.student_email}</strong> has been activated for <strong>${payload.program_slug}</strong>.</p>
        <p>They can now access the course materials.</p>
      `);
    }

    return res.send(`
      <h1>❌ Enrollment Declined</h1>
      <p>The request for <strong>${payload.student_email}</strong> to join <strong>${payload.program_slug}</strong> has been declined.</p>
    `);
  } catch (e) {
    return res.status(400).send('Invalid or expired approval link.');
  }
}

async function markEnrollmentActive({ student_email, program_slug }) {
  try {
    if (!supa) return;

    const { data: appUser } = await supa
      .from('app_users')
      .select('id')
      .eq('email', student_email)
      .single();

    if (!appUser) {
      return;
    }

    await supa.from('enrollments').upsert(
      {
        user_id: appUser.id,
        program_slug,
        status: 'active',
        started_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,program_slug',
      }
    );

      `✅ Enrollment activated via approval: ${program_slug} for ${student_email}`
    );
  } catch (e) {
  }
}

async function addFundingNote(student_email, noteData) {
  try {
    if (!supa) return;

    const { data: appUser } = await supa
      .from('app_users')
      .select('id')
      .eq('email', student_email)
      .single();

    if (appUser) {
      await supa.from('notes').insert({
        user_id: appUser.id,
        type: 'funding',
        content: `Case manager approval: ${JSON.stringify(noteData, null, 2)}`,
        created_at: new Date().toISOString(),
      });
    }
  } catch (e) {
  }
}

/**
 * Send email to case manager with approve/decline links
 * Currently logs to console - replace with actual email provider
 */
async function sendCaseManagerEmail({
  to,
  student_email,
  program_slug,
  voucher_id,
  funding_source,
  approveUrl,
  declineUrl,
}) {
  const subject = `Student Enrollment Approval: ${student_email} → ${program_slug}`;

  const body = `
    <h2>Student Enrollment Request</h2>
    <p><strong>Student:</strong> ${student_email}</p>
    <p><strong>Program:</strong> ${program_slug}</p>
    ${voucher_id ? `<p><strong>Voucher ID:</strong> ${voucher_id}</p>` : ''}
    ${funding_source ? `<p><strong>Funding Source:</strong> ${funding_source}</p>` : ''}

    <p>Please review and approve or decline this enrollment request:</p>

    <p>
      <a href="${approveUrl}" style="background:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">
        ✅ APPROVE ENROLLMENT
      </a>
      &nbsp;&nbsp;
      <a href="${declineUrl}" style="background:#dc3545;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">
        ❌ DECLINE
      </a>
    </p>

    <p><small>This link expires in 72 hours.</small></p>
  `;

}

/**
 * Register approval routes with the Express app
 */
function registerApprovalRoutes(app) {

  /**
   * Student requests approval (from any site).
   * POST /api/approvals/request
   * Body: { student_email, program_slug, voucher_id?, case_manager_email, funding_source? }
   */
  app.post('/api/approvals/request', async (req, res) => {
    try {
      if (!supa) {
        return res
          .status(500)
          .json({ ok: false, error: 'Approval system not configured' });
      }

      const {
        student_email,
        program_slug,
        voucher_id,
        case_manager_email,
        funding_source,
      } = req.body || {};

      if (!student_email || !program_slug || !case_manager_email) {
        return res.status(400).json({
          ok: false,
          error:
            'Missing required fields: student_email, program_slug, case_manager_email',
        });
      }

      // Create one-time token (JWT) with short expiry (72h)
      const payload = {
        student_email,
        program_slug,
        voucher_id,
        case_manager_email,
        funding_source,
      };
      const token = jwt.sign(payload, SECRET, {
        algorithm: 'HS256',
        expiresIn: '72h',
      });
      const token_hash = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find or create app_user
      let user_id = null;
      const { data: existingUser } = await supa
        .from('app_users')
        .select('id')
        .eq('email', student_email)
        .maybeSingle();

      if (existingUser) {
        user_id = existingUser.id;
      } else {
        // Create placeholder user for approval tracking
        const { data: newUser } = await supa
          .from('app_users')
          .insert({ email: student_email, auth_user_id: null })
          .select('id')
          .single();
        user_id = newUser?.id;
      }

      await supa.from('case_manager_approvals').insert({
        user_id,
        student_email,
        program_slug,
        voucher_id,
        case_manager_email,
        funding_source,
        token_hash,
        status: 'pending',
      });

      const approveUrl = `${BASE}/accept?token=${encodeURIComponent(token)}`;
      const declineUrl = `${BASE}/decline?token=${encodeURIComponent(token)}`;

      // Send email to case manager
      await sendCaseManagerEmail({
        to: case_manager_email,
        student_email,
        program_slug,
        voucher_id,
        funding_source,
        approveUrl,
        declineUrl,
      });

      res.json({ ok: true, message: 'Approval request sent to case manager' });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // Public GET endpoints from email buttons:
  app.get('/approvals/accept', async (req, res) => {
    await handleDecision(req, res, 'approved');
  });

  app.get('/approvals/decline', async (req, res) => {
    await handleDecision(req, res, 'declined');
  });

  // Admin routes for managing approvals
  app.get('/api/approvals/list', async (req, res) => {
    try {
      if (!supa) {
        return res
          .status(500)
          .json({ error: 'Approval system not configured' });
      }

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
              (r.case_manager_email || '').toLowerCase().includes(needle)
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
  app.post('/api/approvals/admin_decide', async (req, res) => {
    try {
      if (!supa) {
        return res
          .status(500)
          .json({ error: 'Approval system not configured' });
      }

      const { id, decision } = req.body || {};

      if (!id || !['approved', 'declined'].includes(decision)) {
        return res.status(400).json({
          error: 'Invalid request - need id and decision (approved|declined)',
        });
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
            }
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
  app.get('/api/approvals/stats', async (req, res) => {
    try {
      if (!supa) {
        return res
          .status(500)
          .json({ error: 'Approval system not configured' });
      }

      const { data } = await supa
        .from('case_manager_approvals')
        .select('status');

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

}

module.exports = { registerApprovalRoutes };
