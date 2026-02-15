// lib/welcome-packet/index.ts
// Automated Welcome Packet System

import { createClient } from '@/lib/supabase/server';

export interface WelcomePacketData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  programId: string;
  programName: string;
  startDate: string;
  enrollmentId: string;
}

export interface WelcomePacketItem {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'form' | 'video' | 'link';
  url?: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
}

/**
 * Generate welcome packet for new student
 */
export async function generateWelcomePacket(data: WelcomePacketData): Promise<{
  packetId: string;
  items: WelcomePacketItem[];
}> {
  const supabase = await createClient();

  // Create welcome packet record
  const { data: packet, error } = await supabase
    .from('welcome_packets')
    .insert({
      student_id: data.studentId,
      enrollment_id: data.enrollmentId,
      program_id: data.programId,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !packet) {
    throw new Error(`Failed to create welcome packet: ${error?.message}`);
  }

  // Define packet items based on program
  const items: Omit<WelcomePacketItem, 'completed' | 'completedAt'>[] = [
    {
      id: 'welcome-letter',
      title: 'Welcome Letter',
      description: 'Personal welcome message from our team',
      type: 'document',
      url: '/documents/welcome-letter.pdf',
      required: false,
    },
    {
      id: 'student-handbook',
      title: 'Student Handbook',
      description: 'Complete guide to policies and procedures',
      type: 'document',
      url: '/student-handbook',
      required: true,
    },
    {
      id: 'program-workbook',
      title: `${data.programName} Workbook`,
      description: 'Program-specific learning materials',
      type: 'document',
      url: `/workbooks/${data.programId}`,
      required: true,
    },
    {
      id: 'enrollment-agreement',
      title: 'Enrollment Agreement',
      description: 'Review and acknowledge your enrollment terms',
      type: 'form',
      url: `/student/enrollment-agreement/${data.enrollmentId}`,
      required: true,
    },
    {
      id: 'ferpa-rights',
      title: 'FERPA Rights Notification',
      description: 'Your privacy rights under federal law',
      type: 'document',
      url: '/ferpa',
      required: true,
    },
    {
      id: 'technology-setup',
      title: 'Technology Setup Guide',
      description: 'Set up your student portal and LMS access',
      type: 'document',
      url: '/student/tech-setup',
      required: true,
    },
    {
      id: 'financial-aid-info',
      title: 'Financial Aid Information',
      description: 'Understanding your funding and payment options',
      type: 'document',
      url: '/funding',
      required: false,
    },
    {
      id: 'campus-map',
      title: 'Campus Map & Directions',
      description: 'Find your way around campus',
      type: 'document',
      url: '/campus-map',
      required: false,
    },
    {
      id: 'first-day-checklist',
      title: 'First Day Checklist',
      description: 'What to bring and expect on your first day',
      type: 'document',
      url: '/first-day-checklist',
      required: true,
    },
    {
      id: 'orientation-video',
      title: 'Orientation Video',
      description: 'Watch our welcome orientation (15 minutes)',
      type: 'video',
      url: '/orientation/video',
      required: true,
    },
  ];

  // Insert packet items
  const { error: itemsError } = await supabase
    .from('welcome_packet_items')
    .insert(
      items.map((item) => ({
        packet_id: packet.id,
        item_id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        url: item.url,
        required: item.required,
        completed: false,
      }))
    );

  if (itemsError) {
    throw new Error(`Failed to create packet items: ${itemsError.message}`);
  }

  return {
    packetId: packet.id,
    items: items.map((item) => ({
      ...item,
      completed: false,
    })),
  };
}

/**
 * Send welcome packet email
 */
export async function sendWelcomePacketEmail(
  data: WelcomePacketData,
  packetId: string
): Promise<void> {
  const supabase = await createClient();

  const emailContent = `
    <h1>Welcome to Elevate for Humanity, ${data.studentName}!</h1>

    <p>We're thrilled to have you join our ${data.programName} program starting on ${new Date(data.startDate).toLocaleDateString()}.</p>

    <h2>Your Welcome Packet is Ready</h2>
    <p>We've prepared a personalized welcome packet with everything you need to get started:</p>

    <ul>
      <li>Student Handbook</li>
      <li>Program Workbook</li>
      <li>Technology Setup Guide</li>
      <li>First Day Checklist</li>
      <li>And more!</li>
    </ul>

    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/student/welcome-packet/${packetId}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View Your Welcome Packet</a></p>

    <h2>Next Steps</h2>
    <ol>
      <li>Review your welcome packet and complete all required items</li>
      <li>Set up your student portal account</li>
      <li>Watch the orientation video</li>
      <li>Mark your calendar for your first day: ${new Date(data.startDate).toLocaleDateString()}</li>
    </ol>

    <h2>Need Help?</h2>
    <p>Our student services team is here to support you:</p>
    <ul>
      <li>Phone: 317-314-3757</li>
      <li>Email: support@www.elevateforhumanity.org</li>
      <li>Hours: Monday-Friday, 8am-5pm EST</li>
    </ul>

    <p>We look forward to seeing you soon!</p>

    <p>Best regards,<br>
    The Elevate for Humanity Team</p>
  `;

  // Send email via Supabase Edge Function or email service
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to: data.studentEmail,
      subject: `Welcome to ${data.programName} - Your Welcome Packet is Ready!`,
      html: emailContent,
    },
  });

  if (error) {
    // Error: $1
    // Don't throw - email failure shouldn't block enrollment
  }

  // Log email sent
  await supabase.from('email_logs').insert({
    recipient: data.studentEmail,
    subject: `Welcome to ${data.programName}`,
    type: 'welcome_packet',
    sent_at: new Date().toISOString(),
  });
}

/**
 * Mark welcome packet item as completed
 */
export async function completeWelcomePacketItem(
  packetId: string,
  itemId: string,
  studentId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('welcome_packet_items')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('packet_id', packetId)
    .eq('item_id', itemId);

  if (error) {
    throw new Error(`Failed to complete packet item`);
  }

  // Check if all required items are complete
  const { data: items } = await supabase
    .from('welcome_packet_items')
    .select('*')
    .eq('packet_id', packetId);

  const allRequiredComplete = items?.every(
    (item) => !item.required || item.completed
  );

  if (allRequiredComplete) {
    // Mark packet as complete
    await supabase
      .from('welcome_packets')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', packetId);

    // Send completion notification
    await sendWelcomePacketCompletionEmail(packetId, studentId);
  }
}

/**
 * Send welcome packet completion email
 */
async function sendWelcomePacketCompletionEmail(
  packetId: string,
  studentId: string
): Promise<void> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', studentId)
    .single();

  if (!profile) return;

  const emailContent = `
    <h1>Welcome Packet Complete! 🎉</h1>

    <p>Hi ${profile.full_name},</p>

    <p>Congratulations! You've completed all required items in your welcome packet.</p>

    <p>You're all set for your first day. Here's what to expect:</p>

    <ul>
      <li>Arrive 15 minutes early for check-in</li>
      <li>Bring a valid photo ID</li>
      <li>Bring any required materials listed in your first-day checklist</li>
      <li>Be ready to learn and have fun!</li>
    </ul>

    <p>See you soon!</p>

    <p>Best regards,<br>
    The Elevate for Humanity Team</p>
  `;

  await supabase.functions.invoke('send-email', {
    body: {
      to: profile.email,
      subject: "Welcome Packet Complete - You're Ready!",
      html: emailContent,
    },
  });
}

/**
 * Get welcome packet status
 */
export async function getWelcomePacketStatus(packetId: string): Promise<{
  status: 'pending' | 'in_progress' | 'completed';
  completionPercentage: number;
  items: WelcomePacketItem[];
}> {
  const supabase = await createClient();

  const { data: packet } = await supabase
    .from('welcome_packets')
    .select('*')
    .eq('id', packetId)
    .single();

  const { data: items } = await supabase
    .from('welcome_packet_items')
    .select('*')
    .eq('packet_id', packetId);

  if (!packet || !items) {
    throw new Error('Welcome packet not found');
  }

  const totalItems = items.length;
  const completedItems = items.filter((item) => item.completed).length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  let status: 'pending' | 'in_progress' | 'completed' = 'pending';
  if (completedItems === totalItems) {
    status = 'completed';
  } else if (completedItems > 0) {
    status = 'in_progress';
  }

  return {
    status,
    completionPercentage,
    items: items.map((item) => ({
      id: item.item_id,
      title: item.title,
      description: item.description,
      type: item.type,
      url: item.url,
      required: item.required,
      completed: item.completed,
      completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
    })),
  };
}

/**
 * Send reminder email for incomplete welcome packet
 */
export async function sendWelcomePacketReminder(
  packetId: string
): Promise<void> {
  const supabase = await createClient();

  const { data: packet } = await supabase
    .from('welcome_packets')
    .select(
      `
      *,
      student:profiles(full_name, email),
      enrollment:enrollments(
        program:programs(name)
      )
    `
    )
    .eq('id', packetId)
    .single();

  if (!packet || packet.status === 'completed') return;

  const { data: items } = await supabase
    .from('welcome_packet_items')
    .select('*')
    .eq('packet_id', packetId)
    .eq('required', true)
    .eq('completed', false);

  if (!items || items.length === 0) return;

  const emailContent = `
    <h1>Reminder: Complete Your Welcome Packet</h1>

    <p>Hi ${packet.student.full_name},</p>

    <p>You have ${items.length} required item${items.length > 1 ? 's' : ''} remaining in your welcome packet:</p>

    <ul>
      ${items.map((item) => `<li>${item.title}</li>`).join('')}
    </ul>

    <p>Please complete these items before your first day to ensure a smooth start to your program.</p>

    <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/student/welcome-packet/${packetId}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Welcome Packet</a></p>

    <p>Need help? Contact us at support@www.elevateforhumanity.org or 317-314-3757.</p>

    <p>Best regards,<br>
    The Elevate for Humanity Team</p>
  `;

  await supabase.functions.invoke('send-email', {
    body: {
      to: packet.student.email,
      subject: 'Reminder: Complete Your Welcome Packet',
      html: emailContent,
    },
  });
}
