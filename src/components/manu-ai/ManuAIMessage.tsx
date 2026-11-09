import React, { useState } from 'react';
import { Copy, Check, Sparkles, User, Globe } from 'lucide-react';
import { AIMessage } from '../../services/manuAIService';
import { ManuAIFoodCard } from './ManuAIFoodCard';
import { ManuAIRestaurantCard } from './ManuAIRestaurantCard';
import { ManuAIComparisonCard } from './ManuAIComparisonCard';

interface ManuAIMessageProps {
  message: AIMessage;
}

export const ManuAIMessage: React.FC<ManuAIMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const cards = message.metadata?.cards;
  const isWebSearch = message.metadata?.isWebSearch;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format markdown text with bolding and lists cleanly
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Process bold markers (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-cream-50">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={pIdx} className="italic text-cream-200/90">
              {part.slice(1, -1)}
            </em>
          );
        }
        return part;
      });

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 my-1 leading-relaxed text-cream-200/90 text-sm">
            {formattedLine}
          </li>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="leading-relaxed text-sm sm:text-base text-cream-200/90 my-1">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div
      className={`flex items-start space-x-3.5 my-4 group ${
        isUser ? 'flex-row-reverse space-x-reverse' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-amber-400 text-[#0A0807]'
            : 'bg-gradient-to-br from-amber-400/25 to-amber-600/30 border border-amber-400/40 text-amber-300'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-2xl sm:max-w-3xl ${isUser ? 'items-end' : 'items-start'} flex-1`}>
        {/* Role & Time Header */}
        <div className="flex items-center space-x-2 mb-1 px-1 text-[11px] font-mono text-cream-200/40">
          <span className="font-semibold text-cream-200/70">
            {isUser ? 'You' : 'MANU AI'}
          </span>
          {isWebSearch && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/80 bg-amber-400/10 px-1.5 py-0.2 rounded-full">
              <Globe className="w-2.5 h-2.5" />
              Web Verified
            </span>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={`p-4 sm:p-5 rounded-2xl relative ${
            isUser
              ? 'rounded-tr-sm bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 text-cream-100 shadow-md'
              : 'rounded-tl-sm bg-[#181310]/90 border border-cream-200/10 text-cream-100 shadow-lg backdrop-blur-md'
          }`}
        >
          {/* Text Content */}
          <div className="space-y-0.5">{renderFormattedText(message.content)}</div>

          {/* Embedded Cards (Phase 6 Design) */}
          {cards && (
            <div className="mt-4 pt-3 border-t border-cream-200/10 w-full">
              {cards.type === 'foods' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {cards.items.map((food: any) => (
                    <ManuAIFoodCard key={food.id || food.slug} food={food} />
                  ))}
                </div>
              )}

              {cards.type === 'restaurants' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {cards.items.map((restaurant: any) => (
                    <ManuAIRestaurantCard key={restaurant.id || restaurant.slug} restaurant={restaurant} />
                  ))}
                </div>
              )}

              {cards.type === 'comparison' && (
                <ManuAIComparisonCard items={cards.items as any} meta={cards.meta} />
              )}
            </div>
          )}

          {/* Hover Actions (Copy) */}
          {!isUser && (
            <button
              onClick={handleCopy}
              title="Copy message"
              className="absolute bottom-2 right-2 p-1.5 rounded-lg text-cream-200/40 hover:text-amber-300 hover:bg-cream-100/5 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

