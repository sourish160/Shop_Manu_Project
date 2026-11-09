import React from 'react';
import { Sparkles } from 'lucide-react';

interface ManuAITypingProps {
  toolInfo?: { name: string; message?: string } | null;
}

export const ManuAITyping: React.FC<ManuAITypingProps> = ({ toolInfo }) => {
  return (
    <div className="flex items-start space-x-3.5 my-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400/30 to-amber-600/30 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-sm shadow-amber-900/20">
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
      </div>

      {/* Bubble */}
      <div className="p-4 rounded-2xl rounded-tl-sm bg-[#181310]/90 border border-amber-500/20 text-cream-100 backdrop-blur-md max-w-xl shadow-lg">
        <div className="flex items-center space-x-2.5">
          <div className="flex space-x-1.5 items-center">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
          </div>

          <span className="text-xs text-amber-200/80 font-mono tracking-wider flex items-center gap-1.5">
            {toolInfo?.message || 'Consulting kitchen records...'}
          </span>
        </div>
      </div>
    </div>
  );
};
