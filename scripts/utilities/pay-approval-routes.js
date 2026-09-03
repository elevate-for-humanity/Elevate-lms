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

// Case Manager Approval Routes for Pay Backend
// Add this to your existing Pay service routes

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const supa = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const SECRET = process.env.APPROVAL_SECRET;
const BASE = process.env.APPROVAL_BASE_URL; // e.g., https://pay.elevateforhumanity.org/approvals

export const approvals = Router();

/**
 * Student requests approval (from any site).
 * POST /api/approvals/request
 * Body: { student_email, program_slug, voucher_id?, case_manager_email, funding_source? }
 */
approvals.post('/api/approvals/request', async (req, res) => {
  try {
    const {
      student_email,
      program_slug,
      voucher_id,
      case_manager_email,
      funding_source,
    } = req.body || {};

    if (!student_email || !program_slug || !case_manager_email) {
      return res
        .status(400)
        .json({ ok: false, error: 'Missing required fields' });
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
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');

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
approvals.get('/approvals/accept', async (req, res) => {
  await handleDecision(req, res, 'approved');
});

approvals.get('/approvals/decline', async (req, res) => {
  await handleDecision(req, res, 'declined');
});

// --- Helper Functions ---

async function handleDecision(req, res, decision) {
  try {
    const token = String(req.query.token || '');
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
 * Implement with your email provider (Resend, SendGrid, etc.)
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
  // Example with basic fetch to email service
  // Replace with your actual email provider integration

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


  // Example with fetch to email service:
  /*
  const emailResponse = await fetch('YOUR_EMAIL_API_ENDPOINT', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: body
    })
  });
  */
}
