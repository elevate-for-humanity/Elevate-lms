/**
 * Conversation Store for Open Studio
 * 
 * Handles persistence and retrieval of conversation sessions.
 * Uses Supabase for cloud storage with localStorage fallback.
 */

import { createClient } from '@/lib/supabase/client';
import type { AgentMessage, ConversationSession, AgentConfig } from './agent';

export interface StoredConversation {
  id: string;
  user_id: string;
  title: string;
  messages: AgentMessage[];
  config: AgentConfig;
  created_at: string;
  updated_at: string;
}

class ConversationStore {
  private supabase = createClient();
  private userId: string | null = null;
  private localCache: Map<string, ConversationSession> = new Map();

  /**
   * Initialize store with user ID
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadFromCloud();
  }

  /**
   * Load conversations from cloud
   */
  private async loadFromCloud(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data, error } = await this.supabase
        .from('studio_conversations')
        .select('*')
        .eq('user_id', this.userId)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      this.localCache.clear();
      data?.forEach((conv: StoredConversation) => {
        const session: ConversationSession = {
          id: conv.id,
          title: conv.title,
          messages: conv.messages,
          createdAt: new Date(conv.created_at).getTime(),
          updatedAt: new Date(conv.updated_at).getTime(),
          config: conv.config,
        };
        this.localCache.set(conv.id, session);
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // Fallback to localStorage
      this.loadFromLocalStorage();
    }
  }

  /**
   * Load from localStorage as fallback
   */
  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('openstudio_conversations');
      if (saved) {
        const conversations = JSON.parse(saved) as ConversationSession[];
        conversations.forEach(conv => {
          this.localCache.set(conv.id, conv);
        });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  /**
   * Save to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const conversations = Array.from(this.localCache.values());
      localStorage.setItem('openstudio_conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    title: string,
    config: AgentConfig
  ): Promise<ConversationSession> {
    const session: ConversationSession = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config,
    };

    this.localCache.set(session.id, session);
    this.saveToLocalStorage();

    // Try to save to cloud
    if (this.userId) {
      try {
        await this.supabase.from('studio_conversations').insert({
          id: session.id,
          user_id: this.userId,
          title: session.title,
          messages: session.messages,
          config: session.config,
        });
      } catch (error) {
        console.error('Failed to save to cloud:', error);
      }
    }

    return session;
  }

  /**
   * Get a conversation by ID
   */
  getConversation(id: string): ConversationSession | undefined {
    return this.localCache.get(id);
  }

  /**
   * Get all conversations
   */
  getAllConversations(): ConversationSession[] {
    return Array.from(this.localCache.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Update a conversation
   */
  async updateConversation(
    id: string,
    updates: Partial<ConversationSession>
  ): Promise<void> {
    const session = this.localCache.get(id);
    if (!session) return;

    const updated: ConversationSession = {
      ...session,
      ...updates,
      updatedAt: Date.now(),
    };

    this.localCache.set(id, updated);
    this.saveToLocalStorage();

    // Try to save to cloud
    if (this.userId) {
      try {
        await this.supabase
          .from('studio_conversations')
          .update({
            title: updated.title,
            messages: updated.messages,
            updated_at: new Date(updated.updatedAt).toISOString(),
          })
          .eq('id', id);
      } catch (error) {
        console.error('Failed to update in cloud:', error);
      }
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    this.localCache.delete(id);
    this.saveToLocalStorage();

    if (this.userId) {
      try {
        await this.supabase
          .from('studio_conversations')
          .delete()
          .eq('id', id);
      } catch (error) {
        console.error('Failed to delete from cloud:', error);
      }
    }
  }

  /**
   * Search conversations
   */
  searchConversations(query: string): ConversationSession[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllConversations().filter(conv => {
      if (conv.title.toLowerCase().includes(lowerQuery)) return true;
      return conv.messages.some(
        m => m.content.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Export conversation as JSON
   */
  exportConversation(id: string): string | null {
    const session = this.localCache.get(id);
    if (!session) return null;
    return JSON.stringify(session, null, 2);
  }

  /**
   * Import conversation from JSON
   */
  async importConversation(json: string): Promise<ConversationSession | null> {
    try {
      const imported = JSON.parse(json) as ConversationSession;
      imported.id = crypto.randomUUID(); // Generate new ID
      imported.createdAt = Date.now();
      imported.updatedAt = Date.now();
      
      this.localCache.set(imported.id, imported);
      this.saveToLocalStorage();
      
      return imported;
    } catch (error) {
      console.error('Failed to import conversation:', error);
      return null;
    }
  }
}

// Singleton instance
let storeInstance: ConversationStore | null = null;

export function getConversationStore(): ConversationStore {
  if (!storeInstance) {
    storeInstance = new ConversationStore();
  }
  return storeInstance;
}

export default ConversationStore;