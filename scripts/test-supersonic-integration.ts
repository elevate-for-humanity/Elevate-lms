#!/usr/bin/env tsx

/**
 * Integration test for tax services features
 * Tests database connections, API routes, and Supabase storage
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('appointments').select('count').limit(1);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function testAppointmentsTable() {
  try {
    // Test insert
    const testAppointment = {
      service_type: 'test',
      appointment_type: 'video',
      appointment_date: '2025-01-20',
      appointment_time: '10:00:00',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone: '555-0123',
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(testAppointment)
      .select()
      .single();

    if (error) {
      return false;
    }

    // Clean up test data
    if (data) {
      await supabase.from('appointments').delete().eq('id', data.id);
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function testTaxDocumentsTable() {
  try {
    const testDocument = {
      file_name: 'test.pdf',
      file_path: 'test/test.pdf',
      file_size: 1024,
      file_type: 'application/pdf',
      email: 'test@example.com',
      phone: '555-0123',
      status: 'pending_review',
    };

    const { data, error } = await supabase
      .from('tax_documents')
      .insert(testDocument)
      .select()
      .single();

    if (error) {
      return false;
    }

    // Clean up test data
    if (data) {
      await supabase.from('tax_documents').delete().eq('id', data.id);
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function testStorageBucket() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      return false;
    }

    const documentsBucket = buckets?.find((b) => b.id === 'documents');

    if (!documentsBucket) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

async function testEmailConfiguration() {
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    return false;
  }

  if (!resendKey.startsWith('re_')) {
    return false;
  }

  return true;
}

async function runTests() {
  const results = {
    database: await testDatabaseConnection(),
    appointments: await testAppointmentsTable(),
    documents: await testTaxDocumentsTable(),
    storage: await testStorageBucket(),
    email: await testEmailConfiguration(),
  };

  Object.entries(results).forEach(([test, passed]) => {});

  const allPassed = Object.values(results).every((r) => r);

  process.exit(allPassed ? 0 : 1);
}

runTests();
