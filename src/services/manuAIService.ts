// ==============================================================================
// MANU AI SERVICE
// Client service for MANU AI conversational queries, session management,
// and real-time streaming against the InsForge backend.
// ==============================================================================

import { insforge } from '../lib/insforge';

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: any;
  tool_call_id?: string;
  metadata?: {
    cards?: AICardsPayload;
    isWebSearch?: boolean;
    [key: string]: any;
  };
  created_at: string;
}

export interface AIConversation {
  id: string;
  title: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface AIFoodItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  veg_type: 'veg' | 'non_veg';
  available: boolean;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_slug: string;
  restaurant_area: string;
  restaurant_city: string;
  restaurant_verified?: boolean;
  starting_price?: number;
  display_price_text?: string;
  distance_km?: number;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    available: boolean;
  }>;
}

export interface AIRestaurantItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  area: string;
  city: string;
  verified: boolean;
  category?: string;
  logo_url?: string;
  cover_url?: string;
  distance_km?: number;
  active_food_count?: number;
  hours?: Array<{
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
  }>;
}

export interface AIComparisonItem {
  food_id: string;
  food_name: string;
  food_slug: string;
  veg_type: 'veg' | 'non_veg';
  variant_name: string;
  price: number;
  restaurant_id: string;
  restaurant_name: string;
  restaurant_slug: string;
  area: string;
  city: string;
}

export interface AICardsPayload {
  type: 'foods' | 'restaurants' | 'comparison';
  items: AIFoodItem[] | AIRestaurantItem[] | AIComparisonItem[];
  meta?: {
    min_price?: number;
    max_price?: number;
    avg_price?: number;
    dish_query?: string;
  };
}

const STORAGE_SESSION_ID_KEY = 'manu_ai_session_id';
const STORAGE_SESSION_TOKEN_KEY = 'manu_ai_session_token';

// Cryptographically secure anonymous session generation
export function getOrCreateAnonymousSession(): { sessionId: string; sessionToken: string } {
  let sessionId = localStorage.getItem(STORAGE_SESSION_ID_KEY);
  let sessionToken = localStorage.getItem(STORAGE_SESSION_TOKEN_KEY);

  if (!sessionId || !sessionToken) {
    sessionId = 'sess_' + crypto.randomUUID();
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    sessionToken = 'tok_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    localStorage.setItem(STORAGE_SESSION_ID_KEY, sessionId);
    localStorage.setItem(STORAGE_SESSION_TOKEN_KEY, sessionToken);
  }

  return { sessionId, sessionToken };
}

// Fetch all conversations for the active session
export async function fetchAIConversations(): Promise<AIConversation[]> {
  const { sessionToken } = getOrCreateAnonymousSession();
  const { data, error } = await insforge.database.rpc('ai_get_conversations', {
    p_session_token: sessionToken
  });

  if (error) {
    console.warn('Failed to load AI conversations:', error);
    return [];
  }

  return (data as AIConversation[]) || [];
}

// Fetch all messages for a specific conversation
export async function fetchAIMessages(conversationId: string): Promise<AIMessage[]> {
  const { sessionToken } = getOrCreateAnonymousSession();
  const { data, error } = await insforge.database.rpc('ai_get_messages', {
    p_conversation_id: conversationId,
    p_session_token: sessionToken
  });

  if (error) {
    console.warn('Failed to load AI messages:', error);
    return [];
  }

  return (data as AIMessage[]) || [];
}

// Delete a conversation
export async function deleteAIConversation(conversationId: string): Promise<boolean> {
  const { sessionToken } = getOrCreateAnonymousSession();
  const { data, error } = await insforge.database.rpc('ai_delete_conversation', {
    p_conversation_id: conversationId,
    p_session_token: sessionToken
  });

  if (error) {
    console.warn('Failed to delete AI conversation:', error);
    return false;
  }

  return !!data;
}

// Clear all conversations
export async function clearAIConversations(): Promise<boolean> {
  const { sessionToken } = getOrCreateAnonymousSession();
  const { error } = await insforge.database.rpc('ai_clear_conversations', {
    p_session_token: sessionToken
  });

  if (error) {
    console.warn('Failed to clear AI conversations:', error);
    return false;
  }

  return true;
}

// Stream chat with MANU AI
export interface StreamChatParams {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  conversationId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  onToken: (token: string) => void;
  onCards: (cards: AICardsPayload) => void;
  onToolStart: (toolInfo: { name: string; args?: any; message?: string }) => void;
  onConversationId: (conversationId: string) => void;
  onDone: () => void;
  onError: (errorMsg: string) => void;
}

export async function streamAIChat({
  messages,
  conversationId,
  userLocation,
  onToken,
  onCards,
  onToolStart,
  onConversationId,
  onDone,
  onError
}: StreamChatParams): Promise<void> {
  const { sessionId, sessionToken } = getOrCreateAnonymousSession();

  try {
    // Call the deployed InsForge Edge Function 'manu-ai'
    const { data, error } = await insforge.functions.invoke('manu-ai', {
      body: {
        messages,
        conversation_id: conversationId || null,
        session_id: sessionId,
        session_token: sessionToken,
        user_location: userLocation || null
      }
    });

    if (error) {
      throw error;
    }

    // Parse the returned SSE stream string
    const streamText = typeof data === 'string' ? data : JSON.stringify(data);
    const lines = streamText.split('\n');

    let currentEvent = 'message';
    let hasCompleted = false;

    const completeStream = () => {
      if (!hasCompleted) {
        hasCompleted = true;
        onDone();
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('event: ')) {
        currentEvent = trimmed.slice(7).trim();
      } else if (trimmed.startsWith('data: ')) {
        const dataStr = trimmed.slice(6).trim();
        try {
          const parsed = JSON.parse(dataStr);
          if (currentEvent === 'conversation' && parsed.conversation_id) {
            onConversationId(parsed.conversation_id);
          } else if (currentEvent === 'cards') {
            onCards(parsed as AICardsPayload);
          } else if (currentEvent === 'tool_start') {
            onToolStart(parsed);
          } else if (currentEvent === 'token') {
            onToken(typeof parsed === 'string' ? parsed : String(parsed));
          } else if (currentEvent === 'error') {
            onError(parsed.message || 'Error from MANU AI');
          } else if (currentEvent === 'done') {
            completeStream();
          }
        } catch (e) {
          if (currentEvent === 'token') {
            onToken(dataStr);
          }
        }
      }
    }

    completeStream();

  } catch (err: any) {
    console.error('streamAIChat Error:', err);
    onError(err.message || 'Unable to connect to MANU AI. Please try again.');
  }
}
