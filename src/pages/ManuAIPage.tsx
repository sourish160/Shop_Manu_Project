// ==============================================================================
// MANU AI PAGE (/manu-ai)
// Dedicated full-page ChatGPT-like conversational culinary assistant.
// Integrates live InsForge database records, verified portion rates,
// PostGIS distance queries, and OpenAI intelligence.
// ==============================================================================

import React, { useState } from 'react';
import { useManuAI } from '../hooks/useManuAI';
import { useSEO } from '../hooks/useSEO';
import { ManuAISidebar } from '../components/manu-ai/ManuAISidebar';
import { ManuAIChat } from '../components/manu-ai/ManuAIChat';

export const ManuAIPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    conversations,
    currentConversationId,
    messages,
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
  } = useManuAI();

  // Dynamic SEO meta tags
  useSEO({
    title: 'MANU AI — Gastronomic Concierge & Food Intelligence | ManuMania',
    description:
      'Interact with MANU AI for verified Kolkata restaurant menus, real-time portion rates, price comparisons, and culinary recommendations.',
    canonicalUrl: 'https://shopmanu.com/manu-ai'
  });

  const activeConversation = conversations.find((c) => c.id === currentConversationId);

  return (
    <div className="h-[calc(100vh-68px)] sm:h-[calc(100vh-72px)] flex bg-[#0A0807] overflow-hidden">
      {/* Conversation Sidebar */}
      <ManuAISidebar
        conversations={conversations}
        activeConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewChat={startNewChat}
        onDeleteChat={deleteChat}
        onClearAll={clearAllChats}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Workspace */}
      <ManuAIChat
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        streamingCards={streamingCards}
        activeTool={activeTool}
        error={error}
        webSearchEnabled={webSearchEnabled}
        userLocation={userLocation}
        conversationTitle={activeConversation?.title}
        onSendMessage={sendMessage}
        onSelectPrompt={sendMessage}
        onToggleWebSearch={() => setWebSearchEnabled(!webSearchEnabled)}
        onRequestLocation={requestLocation}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={startNewChat}
      />
    </div>
  );
};
