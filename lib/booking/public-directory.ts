import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';

// Public presentation fields only. Staff contact and employment records stay private.
export async function getPublicBookingDirectory() {
  const db = await requireAdminClient();
  const [types, staff, locations] = await Promise.all([
    db.from('appointment_types').select('id, name, description, duration').eq('is_active', true).order('name'),
    db.from('staff').select('id, name, title, avatar_url').eq('accepts_appointments', true).order('name'),
    db.from('locations').select('id, name, address, city, state').eq('is_active', true),
  ]);
  if (types.error || staff.error || locations.error) throw new Error('Appointment directory is unavailable');
  return { appointmentTypes: types.data ?? [], staff: staff.data ?? [], locations: locations.data ?? [] };
}
