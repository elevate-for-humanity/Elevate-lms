import { logger } from '@/lib/logger';

/**
 * Database Schema Guard
 * Verifies columns exist before running queries
 * Prevents "column does not exist" errors
 */

import { createClient } from '@/lib/supabase/server';

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface SchemaVerification {
  table: string;
  exists: boolean;
  columns: ColumnInfo[];
  missingColumns: string[];
}

/**
 * Verify a table exists and has expected columns
 */
export async function verifyTableSchema(
  tableName: string,
  expectedColumns?: string[]
): Promise<SchemaVerification> {
  const supabase = await createClient();

  // Check if table exists
  const { data: tableExists } = await supabase.rpc('check_table_exists', {
    schema_name: 'public',
    table_name: tableName,
  });

  if (!tableExists) {
    return {
      table: tableName,
      exists: false,
      columns: [],
      missingColumns: expectedColumns || [],
    };
  }

  // Get all columns for the table via RPC (PostgREST can't query information_schema directly)
  const { data: columns, error } = await supabase
    .rpc('get_table_columns', { p_table_name: tableName });

  if (error) {
    logger.error('Schema verification error:', error);
    return {
      table: tableName,
      exists: true,
      columns: [],
      missingColumns: expectedColumns || [],
    };
  }

  const columnNames = columns?.map((c) => c.column_name) || [];
  const missingColumns = expectedColumns
    ? expectedColumns.filter((col) => !columnNames.includes(col))
    : [];

  return {
    table: tableName,
    exists: true,
    columns: (columns as ColumnInfo[]) || [],
    missingColumns,
  };
}

/**
 * Verify specific columns exist in a table
 */
export async function verifyColumns(
  tableName: string,
  columnNames: string[]
): Promise<{ [key: string]: boolean }> {
  const verification = await verifyTableSchema(tableName, columnNames);

  const result: { [key: string]: boolean } = {};
  columnNames.forEach((col) => {
    result[col] = !verification.missingColumns.includes(col);
  });

  return result;
}

/**
 * Get all columns for a table
 */
export async function getTableColumns(
  tableName: string
): Promise<ColumnInfo[]> {
  const verification = await verifyTableSchema(tableName);
  return verification.columns;
}

/**
 * Development helper: Log schema verification
 */
export function logSchemaVerification(verification: SchemaVerification): void {
  if (process.env.NODE_ENV === 'development') {
    if (verification.missingColumns.length > 0) {
      logger.info(
        `   ⚠️  Missing columns: ${verification.missingColumns.join(', ')}`
      );
    }

    if (verification.columns.length > 0) {
      verification.columns.forEach((col) => {
        logger.info(`   ✓ ${col.name}: ${col.type}`);
      });
    }
  }
}

/**
 * Assert columns exist (throws error if missing)
 */
export async function assertColumnsExist(
  tableName: string,
  columnNames: string[]
): Promise<void> {
  const verification = await verifyTableSchema(tableName, columnNames);

  if (!verification.exists) {
    throw new Error(`Table '${tableName}' does not exist`);
  }

  if (verification.missingColumns.length > 0) {
    throw new Error(
      `Table '${tableName}' is missing columns: ${verification.missingColumns.join(', ')}\n` +
        `Available columns: ${verification.columns.map((c) => c.column_name).join(', ')}`
    );
  }
}

/**
 * Safe query builder that verifies columns first
 */
export async function safeSelect<T>(
  tableName: string,
  columns: string[]
): Promise<{ data: T[] | null; error: Error | null }> {
  try {
    // Verify columns exist
    await assertColumnsExist(tableName, columns);

    // Execute query
    const supabase = await createClient();
    const { data, error }: any = await supabase
      .from(tableName)
      .select(columns.join(', '));

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as T[], error: null };
  } catch (error) { /* Error handled silently */ 
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
