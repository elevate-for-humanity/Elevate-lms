import { createClient } from '@/lib/supabase/server';

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'card' | 'bank_transfer' | 'paypal' | 'quickbooks_invoice' | 'free';

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  provider?: string | null;
  provider_payment_id?: string | null;
  provider_customer_id?: string | null;
  course_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function getPaymentHistory(userId: string, limit = 50): Promise<Payment[]> {
  const db = await createClient();
  const { data, error } = await db.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as Payment[];
}

export async function getPayment(paymentId: string): Promise<Payment | null> {
  const db = await createClient();
  const { data, error } = await db.from('payments').select('*').eq('id', paymentId).maybeSingle();
  if (error) return null;
  return data as Payment | null;
}

export async function getCoursePrice(courseId: string): Promise<number> {
  const db = await createClient();
  const { data } = await db.from('lms_courses').select('price').eq('id', courseId).maybeSingle();
  return data?.price || 0;
}

export function calculateTotalWithTax(amount: number, taxRate = 0) {
  const tax = amount * taxRate;
  return { subtotal: amount, tax, total: amount + tax };
}
