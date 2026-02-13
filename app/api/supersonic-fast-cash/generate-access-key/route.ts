import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface AccessKeyBody {
  email: string;
  name: string;
  testScore?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: AccessKeyBody = await request.json();
    const { email, name, testScore } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Only generate key if test score is 80% or higher
    if (testScore && testScore < 80) {
      return NextResponse.json(
        { error: 'Must pass competency test with 80% or higher to receive access key' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has an active key
    const { data: existingKey } = await supabase
      .from('training_access_keys')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (existingKey) {
      return NextResponse.json({
        success: true,
        accessKey: existingKey.access_key,
        message: 'Access key already exists',
        alreadyExists: true
      });
    }

    // Generate new access key using database function
    const { data: keyData, error: keyError } = await supabase
      .rpc('create_employee_access_key', {
        p_email: email.toLowerCase(),
        p_employee_name: name,
        p_expires_days: 365 // 1 year expiration
      });

    if (keyError) {
      return NextResponse.json(
        { error: 'Failed to generate access key' },
        { status: 500 }
      );
    }

    const accessKey = keyData;

    // Send email with access key
    try {
      await resend.emails.send({
        from: 'SupersonicFastCash <noreply@supersonicfastcash.com>',
        to: email,
        subject: '🎉 Congratulations! Your FREE Training Access Key',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #16a34a 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .access-key { background: white; border: 3px solid #16a34a; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border-radius: 8px; font-family: monospace; }
              .button { display: inline-block; background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .step { margin: 15px 0; padding-left: 30px; position: relative; }
              .step:before { content: "✓"; position: absolute; left: 0; color: #16a34a; font-weight: bold; font-size: 20px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations ${name}!</h1>
                <p>You've passed the competency test and earned FREE access to all training courses!</p>
              </div>

              <div class="content">
                <h2>Your Training Access Key</h2>
                <p>Use this key to unlock <strong>FREE access to all 7 training courses</strong> (worth $1,074):</p>

                <div class="access-key">${accessKey}</div>

                <p style="text-align: center; color: #666; font-size: 14px;">
                  Keep this key safe! You'll need it to access your training.
                </p>

                <div class="steps">
                  <h3>How to Use Your Access Key:</h3>
                  <div class="step">Go to the training page</div>
                  <div class="step">Click "Enter Access Key"</div>
                  <div class="step">Enter your email and access key</div>
                  <div class="step">Start learning immediately!</div>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/supersonic-fast-cash/careers/training" class="button">
                    Start Training Now →
                  </a>
                </div>

                <h3>What You Get FREE:</h3>
                <ul>
                  <li>✓ Tax Preparation Fundamentals ($199 value)</li>
                  <li>✓ IRS Ethics & Professional Standards ($149 value)</li>
                  <li>✓ Advanced Tax Returns ($199 value)</li>
                  <li>✓ Small Business Tax Returns ($299 value)</li>
                  <li>✓ Tax Software Mastery ($149 value)</li>
                  <li>✓ Refund Advance Products ($99 value)</li>
                  <li>✓ Client Service Excellence ($79 value)</li>
                </ul>

                <p><strong>Total Value: $1,074 - Yours FREE as an employee!</strong></p>

                <h3>Next Steps:</h3>
                <ol>
                  <li>Complete all training courses at your own pace</li>
                  <li>We'll schedule your interview once training is complete</li>
                  <li>Background check and reference verification</li>
                  <li>Start preparing tax returns and earning money!</li>
                </ol>

                <p>Questions? Reply to this email or contact us at supersonicfastcashllc@gmail.com</p>
              </div>

              <div class="footer">
                <p>SupersonicFastCash Tax Services</p>
                <p>This access key expires in 1 year from issue date.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
    } catch (emailError) {
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      accessKey,
      message: 'Access key generated and sent via email'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate access key' },
      { status: 500 }
    );
  }
}
