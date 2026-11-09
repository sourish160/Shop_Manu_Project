import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  ShieldCheck
} from 'lucide-react';
import { AIConversation } from '../../services/manuAIService';

interface ManuAISidebarProps {
  conversations: AIConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ManuAISidebar: React.FC<ManuAISidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteChat,
  onClearAll,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#0E0B09] border-r border-cream-200/10 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & New Chat */}
        <div className="p-4 border-b border-cream-200/10">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <span className="font-serif text-lg text-cream-100 font-normal">
              Conversations
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-cream-200/60 hover:text-cream-100 hover:bg-cream-100/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 font-sans font-semibold text-xs uppercase tracking-wider transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-none">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-cream-200/40">
            Recent Chats
          </div>

          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-cream-200/40 font-sans">
              No previous conversations yet. Start asking MANU AI!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-sans transition-all ${
                    isActive
                      ? 'bg-amber-400/15 border border-amber-400/30 text-amber-200 font-medium'
                      : 'text-cream-200/70 hover:text-cream-100 hover:bg-cream-100/[0.04]'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    className="flex items-center space-x-2.5 flex-1 min-w-0 text-left"
                  >
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'opacity-60'}`} />
                    <span className="truncate">{conv.title}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(conv.id);
                    }}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 hover:text-rose-400 rounded transition-all shrink-0 ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Footer: Privacy Badge + Clear All */}
        <div className="p-3.5 border-t border-cream-200/10 space-y-2.5 bg-[#0A0807]/50">
          {conversations.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full text-center text-[11px] font-mono text-cream-200/40 hover:text-rose-400 transition-colors py-1"
            >
              Clear all history
            </button>
          )}

          <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg bg-cream-100/[0.03] text-[10px] font-mono text-cream-200/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Anonymous Session Isolated</span>
          </div>
        </div>
      </aside>
    </>
  );
};
