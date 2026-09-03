/**
 * Direct Messaging System
 * Student-instructor and peer-to-peer messaging
 */
import { createClient } from '@/lib/supabase/server';
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string; // For group conversations
  participants: string[];
  last_message_at: string;
  created_at: string;
  updated_at: string;
}
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments?: string[];
  read_by: string[];
  deleted_by: string[];
  edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}
export interface MessageNotification {
  id: string;
  user_id: string;
  conversation_id: string;
  message_id: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}
/**
 * Create or get direct conversation
 */
export async function getOrCreateDirectConversation(
  user1_id: string,
  user2_id: string,
): Promise<Conversation> {
  const supabase = await createClient();
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('type', 'direct')
    .contains('participants', [user1_id, user2_id])
    .maybeSingle();
  if (existing) {
    return existing;
  }
  // Create new conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      type: 'direct',
      participants: [user1_id, user2_id],
      last_message_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return conversation;
}
/**
 * Create group conversation
 */
export async function createGroupConversation(
  name: string,
  creator_id: string,
  participant_ids: string[],
): Promise<Conversation> {
  const supabase = await createClient();
  // Include creator in participants
  const participants = Array.from(new Set([creator_id, ...participant_ids]));
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      type: 'group',
      name,
      participants,
      last_message_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return conversation;
}
/**
 * Send message
 */
export async function sendMessage(
  conversation_id: string,
  sender_id: string,
  content: string,
  attachments?: string[],
): Promise<Message> {
  const supabase = await createClient();
  // Verify sender is participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('participants')
    .eq('id', conversation_id)
    .maybeSingle();
  if (!conversation?.participants.includes(sender_id)) {
    throw new Error('User is not a participant in this conversation');
  }
  // Create message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      sender_id,
      content,
      attachments,
      read_by: [sender_id], // Sender has read their own message
      deleted_by: [],
      edited: false,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation_id);
  // Create notifications for other participants
  const otherParticipants = conversation.participants.filter((p) => p !== sender_id);
  await createMessageNotifications(message, otherParticipants);
  return message;
}
/**
 * Edit message
 */
export async function editMessage(
  message_id: string,
  sender_id: string,
  content: string,
): Promise<Message> {
  const supabase = await createClient();
  const { data: message, error } = await supabase
    .from('messages')
    .update({
      content,
      edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', message_id)
    .eq('sender_id', sender_id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return message;
}
/**
 * Delete message (soft delete)
 */
export async function deleteMessage(message_id: string, user_id: string): Promise<void> {
  const supabase = await createClient();
  // Get current deleted_by array
  const { data: message } = await supabase
    .from('messages')
    .select('deleted_by')
    .eq('id', message_id)
    .maybeSingle();
  if (!message) {
    throw new Error('Message not found');
  }
  // Add user to deleted_by array
  const deleted_by = [...message.deleted_by, user_id];
  await supabase.from('messages').update({ deleted_by }).eq('id', message_id);
}
/**
 * Mark message as read
 */
export async function markMessageRead(message_id: string, user_id: string): Promise<void> {
  const supabase = await createClient();
  // Get current read_by array
  const { data: message } = await supabase
    .from('messages')
    .select('read_by, conversation_id')
    .eq('id', message_id)
    .maybeSingle();
  if (!message) {
    throw new Error('Message not found');
  }
  // Add user to read_by array if not already there
  if (!message.read_by.includes(user_id)) {
    const read_by = [...message.read_by, user_id];
    await supabase.from('messages').update({ read_by }).eq('id', message_id);
  }
  // Mark notification as read
  await supabase
    .from('message_notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('message_id', message_id)
    .eq('user_id', user_id);
}
/**
 * Mark all messages in conversation as read
 */
export async function markConversationRead(
  conversation_id: string,
  user_id: string,
): Promise<void> {
  const supabase = await createClient();
  // Get all unread messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, read_by')
    .eq('conversation_id', conversation_id)
    .not('read_by', 'cs', `{${user_id}}`);
  if (!messages) return;
  // Update each message
  for (const message of messages) {
    const read_by = [...message.read_by, user_id];
    await supabase.from('messages').update({ read_by }).eq('id', message.id);
  }
  // Mark all notifications as read
  await supabase
    .from('message_notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversation_id)
    .eq('user_id', user_id)
    .eq('read', false);
}
/**
 * Get user's conversations
 */
export async function getUserConversations(user_id: string): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from('conversations')
    .select(
      `
      *,
      messages(
        id,
        content,
        sender_id,
        created_at,
        profiles(full_name, avatar_url)
      )
    `,
    )
    .contains('participants', [user_id])
    .order('last_message_at', { ascending: false });
  return conversations || [];
}
/**
 * Get conversation messages
 */
export async function getConversationMessages(
  conversation_id: string,
  user_id: string,
  options?: {
    limit?: number;
    before?: string; // message_id for pagination
  },
): Promise<Message[]> {
  const supabase = await createClient();
  // Verify user is participant
  const { data: conversation } = await supabase
    .from('conversations')
    .select('participants')
    .eq('id', conversation_id)
    .maybeSingle();
  if (!conversation?.participants.includes(user_id)) {
    throw new Error('User is not a participant in this conversation');
  }
  let query = supabase
    .from('messages')
    .select('*, profiles(full_name, avatar_url)')
    .eq('conversation_id', conversation_id)
    .not('deleted_by', 'cs', `{${user_id}}`)
    .order('created_at', { ascending: false });
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.before) {
    // Get messages before this message_id
    const { data: beforeMessage } = await supabase
      .from('messages')
      .select('created_at')
      .eq('id', options.before)
      .maybeSingle();
    if (beforeMessage) {
      query = query.lt('created_at', beforeMessage.created_at);
    }
  }
  const { data: messages } = await query;
  return messages || [];
}
/**
 * Get unread message count
 */
export async function getUnreadMessageCount(user_id: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('message_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user_id)
    .eq('read', false);
  return count || 0;
}
/**
 * Get unread messages by conversation
 */
export async function getUnreadMessagesByConversation(
  user_id: string,
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from('message_notifications')
    .select('conversation_id')
    .eq('user_id', user_id)
    .eq('read', false);
  if (!notifications) return {};
  const counts: Record<string, number> = {};
  notifications.forEach((n) => {
    counts[n.conversation_id] = (counts[n.conversation_id] || 0) + 1;
  });
  return counts;
}
/**
 * Add participant to group conversation
 */
export async function addParticipant(
  conversation_id: string,
  user_id: string,
  added_by: string,
): Promise<Conversation> {
  const supabase = await createClient();
  // Verify conversation is group type
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversation_id)
    .eq('type', 'group')
    .maybeSingle();
  if (!conversation) {
    throw new Error('Group conversation not found');
  }
  // Verify added_by is participant
  if (!conversation.participants.includes(added_by)) {
    throw new Error('User is not authorized to add participants');
  }
  // Add new participant
  const participants = Array.from(new Set([...conversation.participants, user_id]));
  const { data: updated, error } = await supabase
    .from('conversations')
    .update({ participants })
    .eq('id', conversation_id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}
/**
 * Remove participant from group conversation
 */
export async function removeParticipant(
  conversation_id: string,
  user_id: string,
  removed_by: string,
): Promise<Conversation> {
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversation_id)
    .eq('type', 'group')
    .maybeSingle();
  if (!conversation) {
    throw new Error('Group conversation not found');
  }
  // Verify removed_by is participant or user is removing themselves
  if (!conversation.participants.includes(removed_by) && removed_by !== user_id) {
    throw new Error('User is not authorized to remove participants');
  }
  // Remove participant
  const participants = conversation.participants.filter((p) => p !== user_id);
  const { data: updated, error } = await supabase
    .from('conversations')
    .update({ participants })
    .eq('id', conversation_id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}
/**
 * Search messages
 */
export async function searchMessages(
  user_id: string,
  query: string,
  conversation_id?: string,
): Promise<Message[]> {
  const supabase = await createClient();
  let messageQuery = supabase
    .from('messages')
    .select('*, conversations!inner(participants)')
    .contains('conversations.participants', [user_id])
    .not('deleted_by', 'cs', `{${user_id}}`)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50);
  if (conversation_id) {
    messageQuery = messageQuery.eq('conversation_id', conversation_id);
  }
  const { data: messages } = await messageQuery;
  return messages || [];
}
/**
 * Create message notifications
 */
async function createMessageNotifications(
  message: Message,
  recipient_ids: string[],
): Promise<void> {
  const supabase = await createClient();
  const notifications = recipient_ids.map((user_id) => ({
    user_id,
    conversation_id: message.conversation_id,
    message_id: message.id,
    read: false,
  }));
  await supabase.from('message_notifications').insert(notifications);
  // Send push/email notifications
}
