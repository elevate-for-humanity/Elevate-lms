/**
 * Tax Client Service
 * Database operations for client management with SSN encryption
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { TaxClient, CreateClientInput } from './types';

function getServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getEncryptionKey(): string {
  return process.env.SSN_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
}

// SSN Encryption utilities
function encryptSSN(ssn: string): string {
  const encryptionKey = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
  let encrypted = cipher.update(ssn.replace(/\D/g, ''), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptSSN(encrypted: string): string {
  const encryptionKey = getEncryptionKey();
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function getLastFour(ssn: string): string {
  const clean = ssn.replace(/\D/g, '');
  return clean.slice(-4);
}

export class ClientService {
  private get supabase() {
    return getServiceClient();
  }

  /**
   * Create a new tax client
   */
  async createClient(input: CreateClientInput): Promise<TaxClient> {
    // Validate SSN
    const cleanSSN = input.ssn.replace(/\D/g, '');
    if (cleanSSN.length !== 9) {
      throw new Error('Invalid SSN: must be 9 digits');
    }

    // Check for duplicate SSN in same office
    const existing = await this.findClientBySSN(input.office_id, cleanSSN);
    if (existing) {
      throw new Error('Client with this SSN already exists in this office');
    }

    const clientData: Record<string, unknown> = {
      office_id: input.office_id,
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone: input.phone,
      address_street: input.address_street,
      address_city: input.address_city,
      address_state: input.address_state,
      address_zip: input.address_zip,
      filing_status: input.filing_status,
      dependents_count: input.dependents_count || 0,
      ssn_encrypted: encryptSSN(cleanSSN),
      ssn_last_four: getLastFour(cleanSSN),
      preferred_preparer_id: input.preferred_preparer_id,
      status: 'active',
      notes: input.notes
    };

    // Handle spouse SSN if provided
    if (input.spouse_ssn) {
      const cleanSpouseSSN = input.spouse_ssn.replace(/\D/g, '');
      if (cleanSpouseSSN.length !== 9) {
        throw new Error('Invalid spouse SSN: must be 9 digits');
      }
      clientData.spouse_first_name = input.spouse_first_name;
      clientData.spouse_last_name = input.spouse_last_name;
      clientData.spouse_ssn_encrypted = encryptSSN(cleanSpouseSSN);
      clientData.spouse_ssn_last_four = getLastFour(cleanSpouseSSN);
    }

    const { data, error } = await this.supabase
      .from('franchise_clients')
      .insert(clientData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create client`);
    
    await this.logAudit('client_created', 'franchise_client', data.id, null, { 
      ...data, 
      ssn_encrypted: '[REDACTED]',
      spouse_ssn_encrypted: '[REDACTED]'
    });
    
    return data as TaxClient;
  }

  /**
   * Get client by ID
   */
  async getClient(clientId: string): Promise<TaxClient | null> {
    const { data, error } = await this.supabase
      .from('franchise_clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get client`);
    }
    
    return data as TaxClient;
  }

  /**
   * Get client with decrypted SSN (use carefully)
   */
  async getClientWithSSN(clientId: string): Promise<TaxClient & { ssn: string; spouse_ssn?: string } | null> {
    const client = await this.getClient(clientId);
    if (!client) return null;

    const result: TaxClient & { ssn: string; spouse_ssn?: string } = {
      ...client,
      ssn: client.ssn_encrypted ? decryptSSN(client.ssn_encrypted) : ''
    };

    if (client.spouse_ssn_encrypted) {
      result.spouse_ssn = decryptSSN(client.spouse_ssn_encrypted);
    }

    return result;
  }

  /**
   * Find client by SSN in an office
   */
  async findClientBySSN(officeId: string, ssn: string): Promise<TaxClient | null> {
    const lastFour = getLastFour(ssn);
    
    // First filter by last four (indexed)
    const { data, error } = await this.supabase
      .from('franchise_clients')
      .select('*')
      .eq('office_id', officeId)
      .eq('ssn_last_four', lastFour);

    if (error) throw new Error(`Failed to search clients`);
    
    // Then verify full SSN match
    for (const client of data || []) {
      if (client.ssn_encrypted) {
        const decrypted = decryptSSN(client.ssn_encrypted);
        if (decrypted === ssn.replace(/\D/g, '')) {
          return client as TaxClient;
        }
      }
    }
    
    return null;
  }

  /**
   * Search clients by name
   */
  async searchClients(officeId: string, query: string): Promise<TaxClient[]> {
    const { data, error } = await this.supabase
      .from('franchise_clients')
      .select('*')
      .eq('office_id', officeId)
      .or(`last_name.ilike.%${query}%,first_name.ilike.%${query}%`)
      .order('last_name', { ascending: true })
      .limit(50);

    if (error) throw new Error(`Failed to search clients`);
    
    return data as TaxClient[];
  }

  /**
   * List clients for an office
   */
  async listClientsByOffice(officeId: string, filters?: {
    status?: string;
    preparerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ clients: TaxClient[]; total: number }> {
    let query = this.supabase
      .from('franchise_clients')
      .select('*', { count: 'exact' })
      .eq('office_id', officeId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.preparerId) {
      query = query.eq('preferred_preparer_id', filters.preparerId);
    }

    query = query.order('last_name', { ascending: true });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to list clients`);
    
    return {
      clients: data as TaxClient[],
      total: count || 0
    };
  }

  /**
   * Update client
   */
  async updateClient(clientId: string, updates: Partial<CreateClientInput>): Promise<TaxClient> {
    const current = await this.getClient(clientId);
    if (!current) throw new Error('Client not found');

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    // Handle non-sensitive fields
    if (updates.first_name) updateData.first_name = updates.first_name;
    if (updates.last_name) updateData.last_name = updates.last_name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.address_street !== undefined) updateData.address_street = updates.address_street;
    if (updates.address_city !== undefined) updateData.address_city = updates.address_city;
    if (updates.address_state !== undefined) updateData.address_state = updates.address_state;
    if (updates.address_zip !== undefined) updateData.address_zip = updates.address_zip;
    if (updates.filing_status !== undefined) updateData.filing_status = updates.filing_status;
    if (updates.dependents_count !== undefined) updateData.dependents_count = updates.dependents_count;
    if (updates.preferred_preparer_id !== undefined) updateData.preferred_preparer_id = updates.preferred_preparer_id;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    // Handle SSN update (rare but possible)
    if (updates.ssn) {
      const cleanSSN = updates.ssn.replace(/\D/g, '');
      if (cleanSSN.length !== 9) {
        throw new Error('Invalid SSN');
      }
      updateData.ssn_encrypted = encryptSSN(cleanSSN);
      updateData.ssn_last_four = getLastFour(cleanSSN);
    }

    // Handle spouse updates
    if (updates.spouse_first_name !== undefined) updateData.spouse_first_name = updates.spouse_first_name;
    if (updates.spouse_last_name !== undefined) updateData.spouse_last_name = updates.spouse_last_name;
    if (updates.spouse_ssn) {
      const cleanSpouseSSN = updates.spouse_ssn.replace(/\D/g, '');
      if (cleanSpouseSSN.length !== 9) {
        throw new Error('Invalid spouse SSN');
      }
      updateData.spouse_ssn_encrypted = encryptSSN(cleanSpouseSSN);
      updateData.spouse_ssn_last_four = getLastFour(cleanSpouseSSN);
    }

    const { data, error } = await this.supabase
      .from('franchise_clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update client`);
    
    await this.logAudit('client_updated', 'franchise_client', clientId, 
      { ...current, ssn_encrypted: '[REDACTED]', spouse_ssn_encrypted: '[REDACTED]' },
      { ...data, ssn_encrypted: '[REDACTED]', spouse_ssn_encrypted: '[REDACTED]' }
    );
    
    return data as TaxClient;
  }

  /**
   * Record return filed for client
   */
  async recordReturnFiled(clientId: string, returnId: string, fee: number): Promise<void> {
    const client = await this.getClient(clientId);
    if (!client) return;

    await this.supabase
      .from('franchise_clients')
      .update({
        returns_filed: (client.returns_filed || 0) + 1,
        total_fees_paid: (client.total_fees_paid || 0) + fee,
        last_return_date: new Date().toISOString().split('T')[0],
        last_return_id: returnId,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);
  }

  /**
   * Mark client as do not serve
   */
  async markDoNotServe(clientId: string, reason: string): Promise<TaxClient> {
    const { data, error } = await this.supabase
      .from('franchise_clients')
      .update({
        status: 'do_not_serve',
        notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update client`);
    
    await this.logAudit('client_marked_dns', 'franchise_client', clientId, null, { reason });
    
    return data as TaxClient;
  }

  /**
   * Log audit event
   */
  private async logAudit(
    eventType: string,
    entityType: string,
    entityId: string,
    oldValues: unknown,
    newValues: unknown
  ): Promise<void> {
    await this.supabase.from('franchise_audit_log').insert({
      action: eventType,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      created_at: new Date().toISOString()
    });
  }
}

export const clientService = new ClientService();
