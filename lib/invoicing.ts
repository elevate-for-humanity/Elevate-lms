import { createClient } from '@/lib/supabase/server';

// =====================================================
// INVOICE TYPES
// =====================================================

export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  payment_id?: string;
  items: InvoiceItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// =====================================================
// INVOICE GENERATION
// =====================================================

/**
 * Generate unique invoice number
 */
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

/**
 * Create invoice
 */
export async function createInvoice(
  userId: string,
  items: InvoiceItem[],
  options?: {
    dueDate?: string;
    notes?: string;
    taxRate?: number;
  }
): Promise<Invoice> {
  const supabase = await createClient();

  // Calculate totals
  const amount = items.reduce((sum, item) => sum + item.total, 0);
  const tax = amount * (options?.taxRate || 0);
  const total = amount + tax;

  // Set due date (default: 30 days from now)
  const dueDate =
    options?.dueDate ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error }: any = await supabase
    .from('invoices')
    .insert({
      invoice_number: generateInvoiceNumber(),
      user_id: userId,
      amount,
      tax,
      total,
      currency: 'usd',
      status: 'draft',
      due_date: dueDate,
      items,
      notes: options?.notes,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (error) return null;

  return data;
}

/**
 * Get user invoices
 */
export async function getUserInvoices(
  userId: string,
  status?: Invoice['status']
): Promise<Invoice[]> {
  const supabase = await createClient();

  let query = supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: Invoice['status'],
  paymentId?: string
): Promise<void> {
  const supabase = await createClient();

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'paid') {
    updates.paid_at = new Date().toISOString();
    if (paymentId) {
      updates.payment_id = paymentId;
    }
  }

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId);

  if (error) throw error;
}

/**
 * Send invoice to user
 */
export async function sendInvoice(invoiceId: string): Promise<void> {
  const supabase = await createClient();

  const invoice = await getInvoice(invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  // Get user email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', invoice.user_id)
    .single();

  if (!profile) throw new Error('User not found');

  // For now, just update status
  // In production, call /.netlify/functions/invoice-pdf to generate PDF

  // Update status
  await updateInvoiceStatus(invoiceId, 'sent');
}

// =====================================================
// PDF GENERATION - Moved to Netlify functions
// =====================================================
// PDF generation has been moved to /.netlify/functions/invoice-pdf
// to reduce the main server bundle size

// =====================================================
// BILLING CYCLES
// =====================================================

/**
 * Create recurring billing cycle
 */
export async function createBillingCycle(
  userId: string,
  amount: number,
  frequency: 'monthly' | 'quarterly' | 'yearly',
  startDate?: string
): Promise<void> {
  const supabase = await createClient();

  const start = startDate || new Date().toISOString();

  await supabase.from('billing_cycles').insert({
    user_id: userId,
    amount,
    frequency,
    next_billing_date: start,
    status: 'active',
  });
}

/**
 * Process due invoices
 */
export async function processDueInvoices(): Promise<void> {
  const supabase = await createClient();

  const now = new Date().toISOString();

  // Get overdue invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('status', 'sent')
    .lt('due_date', now);

  if (!invoices) return;

  // Mark as overdue
  for (const invoice of invoices) {
    await updateInvoiceStatus(invoice.id, 'overdue');

    // Send reminder email
    // await sendOverdueReminder(invoice);
  }
}

// =====================================================
// PAYMENT RECEIPTS - Moved to Netlify functions
// =====================================================
// Receipt generation has been moved to /.netlify/functions/receipt-pdf

// =====================================================
// REPORTING
// =====================================================

/**
 * Get billing summary
 */
export async function getBillingSummary(
  startDate: string,
  endDate: string
): Promise<{
  totalInvoiced: number;
  totalPaid: number;
  totalOverdue: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
}> {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (!invoices) {
    return {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOverdue: 0,
      invoiceCount: 0,
      paidCount: 0,
      overdueCount: 0,
    };
  }

  const summary = {
    totalInvoiced: invoices.reduce((sum, inv) => sum + inv.total, 0),
    totalPaid: invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0),
    totalOverdue: invoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0),
    invoiceCount: invoices.length,
    paidCount: invoices.filter((inv) => inv.status === 'paid').length,
    overdueCount: invoices.filter((inv) => inv.status === 'overdue').length,
  };

  return summary;
}
