import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Globe, MapPin, Compass } from 'lucide-react';

interface ManuAIComposerProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  userLocation: { latitude: number; longitude: number } | null;
  onRequestLocation: () => Promise<any>;
}

export const ManuAIComposer: React.FC<ManuAIComposerProps> = ({
  onSend,
  isStreaming,
  webSearchEnabled,
  onToggleWebSearch,
  userLocation,
  onRequestLocation
}) => {
  const [input, setInput] = useState('');
  const [isRequestingLoc, setIsRequestingLoc] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleLocationClick = async () => {
    if (userLocation) return;
    setIsRequestingLoc(true);
    await onRequestLocation();
    setIsRequestingLoc(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 sm:pb-6">
      <form
        onSubmit={handleSubmit}
        className="relative bg-[#14100D]/95 border border-cream-200/15 focus-within:border-amber-400/50 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl transition-all"
      >
        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask MANU AI about Kolkata dishes, portion rates, or restaurants..."
          rows={1}
          disabled={isStreaming}
          className="w-full bg-transparent text-cream-100 placeholder-cream-200/40 text-sm sm:text-base font-sans resize-none focus:outline-none px-2 py-1 max-h-[180px] scrollbar-none disabled:opacity-50"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-cream-200/10 mt-1">
          {/* Left Controls: Web Search & Location */}
          <div className="flex items-center space-x-2">
            {/* Web Search Toggle (Phase 8) */}
            <button
              type="button"
              onClick={onToggleWebSearch}
              title={webSearchEnabled ? 'Live Web Search: Enabled' : 'Enable Live Web Search'}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all ${
                webSearchEnabled
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'text-cream-200/50 hover:text-cream-200/80 hover:bg-cream-100/5 border border-transparent'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Web Search</span>
            </button>

            {/* Location Pill */}
            <button
              type="button"
              onClick={handleLocationClick}
              disabled={isRequestingLoc}
              title={userLocation ? 'Location active: Territory detected' : 'Enable location for Near Me food search'}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono transition-all ${
                userLocation
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-cream-200/50 hover:text-cream-200/80 hover:bg-cream-100/5 border border-transparent'
              }`}
            >
              {userLocation ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Location Active</span>
                </>
              ) : (
                <>
                  <Compass className={`w-3.5 h-3.5 ${isRequestingLoc ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Use Location</span>
                </>
              )}
            </button>
          </div>

          {/* Right Controls: Character count + Submit Button */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-cream-200/30 hidden sm:inline">
              {input.length}/4000
            </span>

            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              aria-label="Send message"
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isStreaming
                  ? 'bg-amber-400 text-[#0A0807] hover:bg-amber-300 shadow-md shadow-amber-900/30 active:scale-95'
                  : 'bg-cream-100/10 text-cream-200/30 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

