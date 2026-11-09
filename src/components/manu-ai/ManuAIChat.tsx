import React, { useRef, useEffect } from 'react';
import { Menu, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { AIMessage, AICardsPayload } from '../../services/manuAIService';
import { ManuAIMessage } from './ManuAIMessage';
import { ManuAIWelcome } from './ManuAIWelcome';
import { ManuAIComposer } from './ManuAIComposer';
import { ManuAITyping } from './ManuAITyping';

interface ManuAIChatProps {
  messages: AIMessage[];
  isStreaming: boolean;
  streamingContent: string;
  streamingCards: AICardsPayload | null;
  activeTool: { name: string; message?: string } | null;
  error: string | null;
  webSearchEnabled: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  conversationTitle?: string;
  onSendMessage: (text: string) => void;
  onSelectPrompt: (prompt: string) => void;
  onToggleWebSearch: () => void;
  onRequestLocation: () => Promise<any>;
  onToggleSidebar: () => void;
  onNewChat: () => void;
}

export const ManuAIChat: React.FC<ManuAIChatProps> = ({
  messages,
  isStreaming,
  streamingContent,
  streamingCards,
  activeTool,
  error,
  webSearchEnabled,
  userLocation,
  conversationTitle,
  onSendMessage,
  onSelectPrompt,
  onToggleWebSearch,
  onRequestLocation,
  onToggleSidebar,
  onNewChat
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streaming tokens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, activeTool]);

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0A0807] overflow-hidden relative">
      {/* Top Header Bar */}
      <header className="h-14 sm:h-16 border-b border-cream-200/10 px-4 sm:px-6 flex items-center justify-between bg-[#0A0807]/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center space-x-3">
          {/* Mobile Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-cream-200/70 hover:text-cream-100 hover:bg-cream-100/5 focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-serif text-sm sm:text-base text-cream-100 font-normal leading-tight truncate max-w-[200px] sm:max-w-md">
                {conversationTitle || 'MANU AI Gastronomic Concierge'}
              </h2>
              <span className="text-[10px] font-mono text-amber-300/80 uppercase tracking-widest hidden sm:inline">
                Live Kitchen Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onNewChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-cream-100/[0.05] hover:bg-amber-400/10 hover:text-amber-300 text-xs font-mono text-cream-200/70 border border-cream-200/10 hover:border-amber-400/30 transition-all"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Main Messages & Content Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 scrollbar-none">
        <div className="max-w-3xl mx-auto">
          {!hasMessages ? (
            <ManuAIWelcome onSelectPrompt={onSelectPrompt} />
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <ManuAIMessage key={msg.id} message={msg} />
              ))}

              {/* Streaming Assistant Response */}
              {isStreaming && (
                <div>
                  {streamingContent || streamingCards ? (
                    <ManuAIMessage
                      message={{
                        id: 'streaming_temp',
                        conversation_id: '',
                        role: 'assistant',
                        content: streamingContent,
                        metadata: streamingCards ? { cards: streamingCards } : undefined,
                        created_at: new Date().toISOString()
                      }}
                    />
                  ) : (
                    <ManuAITyping toolInfo={activeTool} />
                  )}
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-sans my-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Message Composer */}
      <footer className="shrink-0 pt-2 bg-gradient-to-t from-[#0A0807] via-[#0A0807]/90 to-transparent">
        <ManuAIComposer
          onSend={onSendMessage}
          isStreaming={isStreaming}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={onToggleWebSearch}
          userLocation={userLocation}
          onRequestLocation={onRequestLocation}
        />
      </footer>
    </div>
  );
};

