import { logger } from '@/lib/logger';
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SamEntity {
  id: string;
  user_id: string;
  legal_name: string;
  dba_name?: string;
  uei?: string;
  cage_code?: string;
  ein?: string;
  physical_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  entity_type?: string;
  registration_status: string;
  current_step: number;
  sam_expiration_date?: string;
  naics_codes?: string[];
  created_at: string;
  updated_at: string;
}

interface SamDocument {
  id: string;
  entity_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  verified: boolean;
}

interface SamAlert {
  id: string;
  entity_id: string;
  alert_type: string;
  message: string;
  due_date?: string;
  is_read: boolean;
  created_at: string;
}

interface UEISearchResult {
  uei: string;
  legalBusinessName: string;
  dbaName?: string;
  physicalAddress?: any;
  entityStatus?: string;
}

export function useSamGov() {
  const [entities, setEntities] = useState<SamEntity[]>([]);
  const [currentEntity, setCurrentEntity] = useState<SamEntity | null>(null);
  const [documents, setDocuments] = useState<SamDocument[]>([]);
  const [alerts, setAlerts] = useState<SamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch user's entities
  const fetchEntities = useCallback(async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('sam_entities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntities(data || []);
      
      // Set first entity as current if none selected
      if (data && data.length > 0 && !currentEntity) {
        setCurrentEntity(data[0]);
      }
    } catch (err: any) {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }, [supabase, currentEntity]);

  // Fetch documents for current entity
  const fetchDocuments = useCallback(async () => {
    if (!supabase || !currentEntity) return;

    try {
      const { data, error } = await supabase
        .from('sam_documents')
        .select('*')
        .eq('entity_id', currentEntity.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      logger.error('Error fetching documents:', err);
    }
  }, [supabase, currentEntity]);

  // Fetch alerts for current entity
  const fetchAlerts = useCallback(async () => {
    if (!supabase || !currentEntity) return;

    try {
      const { data, error } = await supabase
        .from('sam_alerts')
        .select('*')
        .eq('entity_id', currentEntity.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (err: any) {
      logger.error('Error fetching alerts:', err);
    }
  }, [supabase, currentEntity]);

  // Create new entity
  const createEntity = async (entityData: Partial<SamEntity>) => {
    if (!supabase) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sam_entities')
        .insert({
          ...entityData,
          user_id: user.id,
          registration_status: 'draft',
          current_step: 1,
        })
        .select()
        .single();

      if (error) throw error;
      
      setEntities(prev => [data, ...prev]);
      setCurrentEntity(data);
      return data;
    } catch (err: any) {
      setError('Request failed');
      return null;
    }
  };

  // Update entity
  const updateEntity = async (id: string, updates: Partial<SamEntity>) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('sam_entities')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setEntities(prev => prev.map(e => e.id === id ? data : e));
      if (currentEntity?.id === id) {
        setCurrentEntity(data);
      }
      return data;
    } catch (err: any) {
      setError('Request failed');
      return null;
    }
  };

  // Search UEI via API
  const searchUEI = async (query: string): Promise<UEISearchResult[]> => {
    try {
      const response = await fetch(`/api/sam-gov/search?name=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return data.entities || [];
    } catch (err) {
      logger.error('UEI search error:', err);
      return [];
    }
  };

  // Sync entity from SAM.gov
  const syncFromSamGov = async (uei: string) => {
    try {
      const response = await fetch('/api/sam-gov/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uei }),
      });
      
      if (!response.ok) throw new Error('Sync failed');
      const data = await response.json();
      
      if (data.entity && currentEntity) {
        await updateEntity(currentEntity.id, data.entity);
      }
      
      return data;
    } catch (err) {
      logger.error('Sync error:', err);
      return null;
    }
  };

  // Upload document
  const uploadDocument = async (file: File, documentType: string) => {
    if (!supabase || !currentEntity) return null;

    try {
      // Upload to storage
      const fileName = `${currentEntity.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sam_documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sam_documents')
        .getPublicUrl(fileName);

      // Create document record
      const { data, error } = await supabase
        .from('sam_documents')
        .insert({
          entity_id: currentEntity.id,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      
      setDocuments(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError('Request failed');
      return null;
    }
  };

  // Mark alert as read
  const markAlertRead = async (alertId: string) => {
    if (!supabase) return;

    try {
      await supabase
        .from('sam_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
    } catch (err) {
      logger.error('Error marking alert read:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // Fetch related data when entity changes
  useEffect(() => {
    if (currentEntity) {
      fetchDocuments();
      fetchAlerts();
    }
  }, [currentEntity, fetchDocuments, fetchAlerts]);

  return {
    // State
    entities,
    currentEntity,
    documents,
    alerts,
    loading,
    error,
    
    // Actions
    setCurrentEntity,
    createEntity,
    updateEntity,
    searchUEI,
    syncFromSamGov,
    uploadDocument,
    markAlertRead,
    refresh: fetchEntities,
  };
}
