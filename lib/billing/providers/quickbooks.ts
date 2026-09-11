import 'server-only';
import { createHash } from 'node:crypto';

import type {
  BillingCustomerInput,
  BillingInvoiceResult,
  BillingLineInput,
  BillingProviderAdapter,
  ManualInvoiceInput,
} from '../contracts';
import { assertProviderCanCreateCharges, loadBillingProviderConfig } from '../config';
import {
  escapeQuickBooksQuery,
  loadQuickBooksConfig,
  quickBooksRequest,
} from '@/lib/integrations/quickbooks-client';

type Database = any;

async function ensureCustomer(db: Database, input: BillingCustomerInput) {
  const config = await loadQuickBooksConfig(db);
  const query = encodeURIComponent(
    `select * from Customer where PrimaryEmailAddr = '${escapeQuickBooksQuery(input.email)}' maxresults 1`,
  );
  const found = await quickBooksRequest<any>(db, config, `query?query=${query}`);
  if (found.QueryResponse?.Customer?.[0]) return found.QueryResponse.Customer[0];
  const created = await quickBooksRequest<any>(db, config, 'customer', {
    method: 'POST',
    body: JSON.stringify({
      DisplayName: input.displayName,
      PrimaryEmailAddr: { Address: input.email },
      Notes: `Elevate customer key: ${input.externalKey}`,
    }),
  });
  return created.Customer;
}

async function ensureItem(db: Database, line: BillingLineInput) {
  const config = await loadQuickBooksConfig(db);
  const name = `Elevate | ${line.canonicalKey}`.slice(0, 100);
  const query = encodeURIComponent(
    `select * from Item where Name = '${escapeQuickBooksQuery(name)}' maxresults 1`,
  );
  const found = await quickBooksRequest<any>(db, config, `query?query=${query}`);
  if (found.QueryResponse?.Item?.[0]) return found.QueryResponse.Item[0];
  const incomeQuery = encodeURIComponent(
    "select * from Account where AccountType = 'Income' maxresults 1",
  );
  const income = await quickBooksRequest<any>(db, config, `query?query=${incomeQuery}`);
  const incomeAccountId = income.QueryResponse?.Account?.[0]?.Id;
  if (!incomeAccountId)
    throw new Error('QuickBooks needs an income account before catalog items can be created.');
  const created = await quickBooksRequest<any>(db, config, 'item', {
    method: 'POST',
    body: JSON.stringify({
      Name: name,
      Type: 'Service',
      Description: line.description || line.name,
      UnitPrice: line.unitAmountCents / 100,
      IncomeAccountRef: { value: incomeAccountId },
    }),
  });
  return created.Item;
}

export function createQuickBooksBillingProvider(db: Database): BillingProviderAdapter {
  return {
    provider: 'quickbooks',
    async createManualInvoice(input: ManualInvoiceInput): Promise<BillingInvoiceResult> {
      assertProviderCanCreateCharges('quickbooks', await loadBillingProviderConfig(db));
      const existing = await db
        .from('billing_invoices')
        .select('provider_invoice_id,invoice_number,payment_url,total_cents,status')
        .eq('idempotency_key', input.idempotencyKey)
        .maybeSingle();
      if (existing.error)
        throw new Error(`Could not check invoice idempotency: ${existing.error.message}`);
      if (existing.data?.provider_invoice_id)
        return {
          provider: 'quickbooks',
          providerInvoiceId: existing.data.provider_invoice_id,
          invoiceNumber: existing.data.invoice_number || undefined,
          paymentUrl: existing.data.payment_url || undefined,
          totalCents: existing.data.total_cents,
        };

      const totalCents = input.lines.reduce(
        (sum, line) => sum + line.quantity * line.unitAmountCents,
        0,
      );
      if (existing.data && existing.data.status !== 'failed')
        throw new Error('An invoice with this idempotency key is already being created.');
      const reservation = existing.data
        ? await db
            .from('billing_invoices')
            .update({
              status: 'draft',
              customer_external_key: input.customer.externalKey,
              customer_email: input.customer.email,
              total_cents: totalCents,
              due_at: input.dueDate,
              fulfillment_type: input.fulfillment?.type || null,
              fulfillment_payload: input.fulfillment?.payload || {},
              updated_at: new Date().toISOString(),
            })
            .eq('idempotency_key', input.idempotencyKey)
            .eq('status', 'failed')
            .select('id')
            .maybeSingle()
        : await db
            .from('billing_invoices')
            .insert({
              provider: 'quickbooks',
              provider_invoice_id: null,
              idempotency_key: input.idempotencyKey,
              customer_external_key: input.customer.externalKey,
              customer_email: input.customer.email,
              total_cents: totalCents,
              currency: 'USD',
              status: 'draft',
              due_at: input.dueDate,
              fulfillment_type: input.fulfillment?.type || null,
              fulfillment_payload: input.fulfillment?.payload || {},
            })
            .select('id')
            .single();
      if (reservation.error) {
        if (reservation.error.code === '23505')
          throw new Error('An invoice with this idempotency key is already being created.');
        throw new Error(`Could not reserve invoice: ${reservation.error.message}`);
      }
      if (!reservation.data) throw new Error('This invoice retry is already being processed.');

      try {
        const config = await loadQuickBooksConfig(db);
        const customer = await ensureCustomer(db, input.customer);
        const lineItems = await Promise.all(
          input.lines.map(async (line) => ({ line, item: await ensureItem(db, line) })),
        );
        const result = await quickBooksRequest<any>(db, config, 'invoice', {
          method: 'POST',
          headers: {
            'Request-Id': createHash('sha256')
              .update(input.idempotencyKey)
              .digest('hex')
              .slice(0, 50),
          },
          body: JSON.stringify({
            CustomerRef: { value: customer.Id },
            DueDate: input.dueDate,
            BillEmail: { Address: input.customer.email },
            PrivateNote: `${input.memo || 'Elevate invoice'} | key=${input.idempotencyKey}`,
            AllowOnlineCreditCardPayment: true,
            AllowOnlineACHPayment: true,
            Line: lineItems.map(({ line, item }) => ({
              Amount: (line.quantity * line.unitAmountCents) / 100,
              DetailType: 'SalesItemLineDetail',
              Description: line.description || line.name,
              SalesItemLineDetail: {
                ItemRef: { value: item.Id, name: item.Name },
                Qty: line.quantity,
                UnitPrice: line.unitAmountCents / 100,
              },
            })),
          }),
        });
        const invoice = result.Invoice;
        const paymentUrl = invoice.InvoiceLink || null;
        const inserted = await db
          .from('billing_invoices')
          .update({
            provider_invoice_id: invoice.Id,
            invoice_number: invoice.DocNumber || null,
            status: 'open',
            payment_url: paymentUrl,
            provider_payload: invoice,
            updated_at: new Date().toISOString(),
          })
          .eq('idempotency_key', input.idempotencyKey)
          .eq('status', 'draft');
        if (inserted.error)
          throw new Error(
            `Invoice created in QuickBooks but local tracking failed: ${inserted.error.message}`,
          );
        return {
          provider: 'quickbooks',
          providerInvoiceId: invoice.Id,
          invoiceNumber: invoice.DocNumber || undefined,
          paymentUrl: paymentUrl || undefined,
          totalCents,
        };
      } catch (cause) {
        await db
          .from('billing_invoices')
          .update({
            status: 'failed',
            provider_payload: { error: cause instanceof Error ? cause.message : String(cause) },
            updated_at: new Date().toISOString(),
          })
          .eq('idempotency_key', input.idempotencyKey)
          .eq('status', 'draft');
        throw cause;
      }
    },
  };
}
