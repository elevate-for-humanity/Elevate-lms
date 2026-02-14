import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  getDay3Email, 
  getDay7Email, 
  getReengagementEmail,
  CourseEmailData 
} from '@/lib/email/career-course-sequences';

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job daily
// scheduled cron or external service like cron-job.org

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { day3: 0, day7: 0, reengagement: 0, errors: [] as string[] };

  try {
    // Get all purchases with user info
    const { data: purchases } = await supabase
      .from('career_course_purchases')
      .select(`
        *,
        course:career_courses(title, slug),
        profile:profiles(first_name, email)
      `)
      .eq('status', 'completed');

    if (!purchases) {
      return NextResponse.json({ message: 'No purchases found', results });
    }

    const now = new Date();

    for (const purchase of purchases) {
      const purchaseDate = new Date(purchase.purchased_at);
      const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

      const emailData: CourseEmailData = {
        email: purchase.email || purchase.profile?.email,
        firstName: purchase.profile?.first_name,
        courseName: purchase.course?.title || 'your course',
        courseSlug: purchase.course?.slug || '',
        purchaseDate: purchase.purchased_at,
      };

      // Day 3 email
      if (daysSincePurchase === 3) {
        try {
          const email = getDay3Email(emailData);
          await sendEmail(emailData.email, email.subject, email.html);
          results.day3++;
        } catch (e: any) {
          results.errors.push(`Day 3 email failed for ${emailData.email}: ${e.message}`);
        }
      }

      // Day 7 email
      if (daysSincePurchase === 7) {
        try {
          const email = getDay7Email(emailData);
          await sendEmail(emailData.email, email.subject, email.html);
          results.day7++;
        } catch (e: any) {
          results.errors.push(`Day 7 email failed for ${emailData.email}: ${e.message}`);
        }
      }

      // Re-engagement email (14+ days without login)
      if (daysSincePurchase >= 14 && daysSincePurchase % 7 === 0) {
        // Check last activity (you'd need to track this)
        try {
          const email = getReengagementEmail({ ...emailData, lastLoginDays: daysSincePurchase });
          await sendEmail(emailData.email, email.subject, email.html);
          results.reengagement++;
        } catch (e: any) {
          results.errors.push(`Re-engagement email failed for ${emailData.email}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({ 
      message: 'Email sequence processed',
      results 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html }),
  });

  if (!response.ok) {
    throw new Error(`Email send failed: ${response.statusText}`);
  }
}
