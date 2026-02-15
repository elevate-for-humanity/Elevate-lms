import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AI_INSTRUCTORS } from '@/lib/ai-instructors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get real instructors from profiles
    const { data: instructors, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, bio')
      .eq('role', 'instructor')
      .limit(20);

    if (error) throw error;

    // Get existing appointments to determine availability
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: bookedAppointments } = await supabase
      .from('appointments')
      .select('appointment_date, appointment_time')
      .gte('appointment_date', today.toISOString().split('T')[0])
      .lte('appointment_date', nextWeek.toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed']);

    const bookedSlots = new Set(
      (bookedAppointments || []).map(
        (a) => `${a.appointment_date}-${a.appointment_time}`
      )
    );

    // Generate real availability based on booked appointments
    const generateRealTimeSlots = () => {
      const slots = [];
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const dateStr = date.toISOString().split('T')[0];

        ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].forEach(
          (time) => {
            const slotKey = `${dateStr}-${time}:00`;
            slots.push({
              id: `slot-${dateStr}-${time}`,
              date: dateStr,
              time,
              available: !bookedSlots.has(slotKey),
              platform: 'zoom',
            });
          }
        );
      }
      return slots;
    };

    // Transform real instructors
    const formattedInstructors = (instructors || []).map((instructor) => ({
      id: instructor.id,
      name: instructor.full_name || 'Instructor',
      title: 'Senior Instructor',
      avatar: instructor.avatar_url || '/images/avatars/default.jpg',
      specialties: ['Career Training', 'Professional Development'],
      rating: 4.8,
      totalSessions: 50,
      availability: generateRealTimeSlots(),
      bio: instructor.bio || '',
    }));

    // Add AI instructors as available for booking
    const aiInstructorsList = AI_INSTRUCTORS.map((ai) => ({
      id: ai.id,
      name: ai.name,
      title: ai.title,
      avatar: ai.avatar,
      specialties: ai.categories.slice(0, 3),
      rating: 4.9,
      totalSessions: 200,
      availability: generateRealTimeSlots(),
      bio: ai.bio,
      isAI: true,
    }));

    // Combine real and AI instructors
    const allInstructors = [...formattedInstructors, ...aiInstructorsList];

    return NextResponse.json({ instructors: allInstructors });
  } catch (error) {
    logger.error('Error fetching instructors:', error);
    
    // Fallback to AI instructors only
    const aiInstructors = AI_INSTRUCTORS.map((ai) => ({
      id: ai.id,
      name: ai.name,
      title: ai.title,
      avatar: ai.avatar,
      specialties: ai.categories.slice(0, 3),
      rating: 4.9,
      totalSessions: 200,
      availability: [],
      bio: ai.bio,
      isAI: true,
    }));

    return NextResponse.json({ instructors: aiInstructors });
  }
}
