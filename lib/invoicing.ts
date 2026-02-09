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

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoice, profile);

  // Send email (implement email service)
  // await sendEmail({
  //   to: profile.email,
  //   subject: `Invoice ${invoice.invoice_number}`,
  //   body: `Dear ${profile.first_name}, please find your invoice attached.`,
  //   attachments: [{ filename: `invoice-${invoice.invoice_number}.pdf`, content: pdfBuffer }]
  // });

  // Update status
  await updateInvoiceStatus(invoiceId, 'sent');
}

// =====================================================
// PDF GENERATION
// =====================================================

/**
 * Generate invoice PDF
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  userProfile: any
): Promise<Buffer> {
  // Dynamic import to reduce bundle size
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;
  
  const doc = new jsPDF();

  // Company header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 20);

  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Elevate for Humanity', 20, 30);
  doc.text('8888 Keystone Crossing Suite 1300', 20, 35);
  doc.text('Indianapolis, IN 46240', 20, 40);
  doc.text('elevate4humanityedu@gmail.com', 20, 45);
  doc.text('(317) 314-3757', 20, 50);

  // Invoice details
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', 140, 30);
  doc.text('Invoice Date:', 140, 35);
  doc.text('Due Date:', 140, 40);
  doc.text('Status:', 140, 45);

  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, 175, 30);
  doc.text(new Date(invoice.created_at).toLocaleDateString(), 175, 35);
  doc.text(new Date(invoice.due_date).toLocaleDateString(), 175, 40);
  doc.text(invoice.status.toUpperCase(), 175, 45);

  // Bill to
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`${userProfile.first_name} ${userProfile.last_name}`, 20, 65);
  doc.text(userProfile.email, 20, 70);

  // Items table
  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    `$${item.unit_price.toFixed(2)}`,
    `$${item.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
    },
  });

  // Totals
  const finalY = (doc as string).lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 140, finalY);
  doc.text('Tax:', 140, finalY + 7);
  doc.text('TOTAL:', 140, finalY + 14);

  doc.setFont('helvetica', 'normal');
  doc.text(`$${invoice.amount.toFixed(2)}`, 175, finalY);
  doc.text(`$${invoice.tax.toFixed(2)}`, 175, finalY + 7);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${invoice.total.toFixed(2)}`, 175, finalY + 14);

  // Notes
  if (invoice.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes:', 20, finalY + 30);
    doc.text(invoice.notes, 20, finalY + 35, { maxWidth: 170 });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Download invoice PDF
 */
export function downloadInvoicePDF(doc: jsPDF, invoiceNumber: string): void {
  doc.save(`invoice-${invoiceNumber}.pdf`);
}

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
// PAYMENT RECEIPTS
// =====================================================

/**
 * Generate payment receipt
 */
export async function generateReceipt(paymentId: string): Promise<Buffer> {
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from('payments')
    .select('*, user:profiles!user_id(*)')
    .eq('id', paymentId)
    .single();

  if (!payment) throw new Error('Payment not found');

  // Dynamic import to reduce bundle size
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;
  
  const doc = new jsPDF();

  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', 20, 20);

  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Elevate for Humanity', 20, 30);
  doc.text('Thank you for your payment!', 20, 35);

  // Receipt details
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Number:', 20, 50);
  doc.text('Date:', 20, 57);
  doc.text('Payment Method:', 20, 64);
  doc.text('Status:', 20, 71);

  doc.setFont('helvetica', 'normal');
  doc.text(payment.id.substring(0, 8).toUpperCase(), 60, 50);
  doc.text(new Date(payment.created_at).toLocaleDateString(), 60, 57);
  doc.text(payment.payment_method.toUpperCase(), 60, 64);
  doc.text(payment.status.toUpperCase(), 60, 71);

  // Customer info
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER:', 20, 90);
  doc.setFont('helvetica', 'normal');
  doc.text(`${payment.user.first_name} ${payment.user.last_name}`, 20, 97);
  doc.text(payment.user.email, 20, 104);

  // Payment details
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS:', 20, 120);

  autoTable(doc, {
    startY: 125,
    head: [['Description', 'Amount']],
    body: [
      [
        payment.description || 'Course Purchase',
        `$${payment.amount.toFixed(2)}`,
      ],
    ],
    theme: 'plain',
    styles: {
      fontSize: 10,
    },
  });

  const finalY = (doc as string).lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TOTAL PAID:', 20, finalY);
  doc.text(`$${payment.amount.toFixed(2)}`, 60, finalY);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('This is an official receipt for your records.', 105, 280, {
    align: 'center',
  });

  return Buffer.from(doc.output('arraybuffer'));
}

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
