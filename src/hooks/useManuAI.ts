// ==============================================================================
// USE MANU AI HOOK
// Custom React Hook orchestrating conversations, streaming messages,
// tool notifications, location integration, and offline persistence.
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  AIMessage,
  AIConversation,
  AICardsPayload,
  fetchAIConversations,
  fetchAIMessages,
  deleteAIConversation,
  clearAIConversations,
  streamAIChat,
  getOrCreateAnonymousSession
} from '../services/manuAIService';
import { loadSessionLocation } from '../utils/geolocation';

export function useManuAI() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingCards, setStreamingCards] = useState<AICardsPayload | null>(null);
  const [activeTool, setActiveTool] = useState<{ name: string; args?: any; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Initialize session and load conversations
  useEffect(() => {
    getOrCreateAnonymousSession();
    loadConversations();

    // Check for cached user location
    const cachedLoc = loadSessionLocation();
    if (cachedLoc?.latitude != null && cachedLoc?.longitude != null) {
      setUserLocation({
        latitude: cachedLoc.latitude,
        longitude: cachedLoc.longitude
      });
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await fetchAIConversations();
      setConversations(convs);
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    }
  }, []);

  // Request browser location if not already granted
  const requestLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (userLocation) return userLocation;
    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserLocation(loc);
          resolve(loc);
        },
        () => {
          resolve(null);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }, [userLocation]);

  // Select a conversation from sidebar
  const selectConversation = useCallback(async (convId: string) => {
    if (convId === currentConversationId) return;
    setIsLoading(true);
    setError(null);
    setCurrentConversationId(convId);
    setStreamingContent('');
    setStreamingCards(null);
    setActiveTool(null);

    try {
      const msgs = await fetchAIMessages(convId);
      setMessages(msgs);
    } catch (err: any) {
      setError('Failed to load conversation messages.');
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId]);

  // Start fresh chat
  const startNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setStreamingCards(null);
    setActiveTool(null);
    setError(null);
  }, []);

  // Delete a specific conversation
  const deleteChat = useCallback(async (convId: string) => {
    const success = await deleteAIConversation(convId);
    if (success) {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversationId === convId) {
        startNewChat();
      }
    }
  }, [currentConversationId, startNewChat]);

  // Clear all chats
  const clearAllChats = useCallback(async () => {
    const success = await clearAIConversations();
    if (success) {
      setConversations([]);
      startNewChat();
    }
  }, [startNewChat]);

  // Send message
  const sendMessage = useCallback(async (userPrompt: string) => {
    const cleanPrompt = userPrompt.trim();
    if (!cleanPrompt || isStreaming) return;

    setError(null);

    // Optimistic user message
    const tempUserMsg: AIMessage = {
      id: 'temp_user_' + Date.now(),
      conversation_id: currentConversationId || '',
      role: 'user',
      content: cleanPrompt,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingCards(null);
    setActiveTool({ name: 'thinking', message: 'Consulting kitchen records...' });

    // Build context messages for API
    const contextMsgs = messages
      .slice(-6)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    contextMsgs.push({ role: 'user', content: cleanPrompt });

    // Request location if user prompt suggests proximity
    let effectiveLocation = userLocation;
    const lower = cleanPrompt.toLowerCase();
    if (lower.includes('near') || lower.includes('closest') || lower.includes('around me')) {
      effectiveLocation = await requestLocation();
    }

    let accumulatedText = '';
    let accumulatedCards: AICardsPayload | null = null;
    let resolvedConvId = currentConversationId;
    let hasFinalized = false;

    await streamAIChat({
      messages: contextMsgs,
      conversationId: currentConversationId,
      userLocation: effectiveLocation,
      onConversationId: (newConvId) => {
        resolvedConvId = newConvId;
        setCurrentConversationId(newConvId);
      },
      onToolStart: (toolInfo) => {
        let label = 'Searching database...';
        if (toolInfo.name === 'search_menu_items') label = 'Searching dishes & portion rates...';
        else if (toolInfo.name === 'compare_food_prices') label = 'Comparing prices across kitchens...';
        else if (toolInfo.name === 'search_restaurants') label = 'Finding verified restaurants...';
        else if (toolInfo.name === 'find_nearby_foods') label = 'Calculating distance to nearby foods...';
        else if (toolInfo.name === 'get_restaurant_menu') label = 'Loading verified menu...';
        setActiveTool({ name: toolInfo.name, args: toolInfo.args, message: label });
      },
      onCards: (cards) => {
        accumulatedCards = cards;
        setStreamingCards(cards);
      },
      onToken: (token) => {
        accumulatedText += token;
        setStreamingContent((prev) => prev + token);
      },
      onDone: () => {
        if (hasFinalized) return;
        hasFinalized = true;

        setIsStreaming(false);
        setActiveTool(null);

        // Finalize assistant message in local state
        const assistantMsg: AIMessage = {
          id: 'temp_asst_' + Date.now(),
          conversation_id: resolvedConvId || '',
          role: 'assistant',
          content: accumulatedText,
          metadata: accumulatedCards ? { cards: accumulatedCards } : undefined,
          created_at: new Date().toISOString()
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent('');
        setStreamingCards(null);

        // Refresh conversation sidebar list
        loadConversations();
      },
      onError: (errMsg) => {
        setIsStreaming(false);
        setActiveTool(null);
        setError(errMsg);
      }
    });

  }, [isStreaming, currentConversationId, messages, userLocation, requestLocation, loadConversations]);

  return {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    streamingCards,
    activeTool,
    error,
    webSearchEnabled,
    userLocation,
    setWebSearchEnabled,
    sendMessage,
    selectConversation,
    startNewChat,
    deleteChat,
    clearAllChats,
    requestLocation
  };
}
