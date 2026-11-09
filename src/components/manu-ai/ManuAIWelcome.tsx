import React from 'react';
import { Sparkles, Utensils, Scale, MapPin, Coffee } from 'lucide-react';

interface ManuAIWelcomeProps {
  onSelectPrompt: (prompt: string) => void;
}

const PROMPT_SUGGESTIONS = [
  {
    icon: Utensils,
    title: 'Find Chicken Biryani',
    description: 'Search Kolkata dum biryani with verified portion rates & soft potatoes.',
    prompt: 'Find authentic chicken biryani in Kolkata with portion rates'
  },
  {
    icon: Scale,
    title: 'Compare Roll Rates',
    description: 'Side-by-side price comparison of Kathi rolls across Park Street kitchens.',
    prompt: 'Compare roll prices between Kusum Rolls and Nizam’s'
  },
  {
    icon: Coffee,
    title: 'Park Street Heritage',
    description: 'Discover legendary tearooms, chelo kebabs, and bakeries established since 1927.',
    prompt: 'Show me iconic restaurants on Park Street with their specialties'
  },
  {
    icon: MapPin,
    title: 'Budget Dining',
    description: 'Locate top-rated Mughlai and street food dishes under ₹250.',
    prompt: 'What are the best dishes under ₹250 in Kolkata?'
  }
];

export const ManuAIWelcome: React.FC<ManuAIWelcomeProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex flex-col items-center justify-center max-w-3xl mx-auto px-4 py-8 sm:py-16 text-center animate-fade-in">
      {/* Decorative Chef Emblem */}
      <div className="relative mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-amber-400/30 to-amber-600/10 border border-amber-400/40 flex items-center justify-center shadow-2xl shadow-amber-900/30 backdrop-blur-md">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 animate-pulse" />
        </div>
        <span className="absolute -bottom-2 -right-2 text-[10px] uppercase font-mono tracking-widest bg-amber-400 text-[#0A0807] font-bold px-2 py-0.5 rounded-full shadow-md">
          AI Concierge
        </span>
      </div>

      {/* Title */}
      <h1 className="font-serif text-3xl sm:text-5xl text-cream-100 font-light tracking-tight leading-tight">
        Welcome to <span className="italic text-amber-300">MANU AI</span>
      </h1>

      <p className="font-sans text-sm sm:text-base text-cream-200/70 max-w-xl mt-3 leading-relaxed">
        Your personal gastronomic concierge for ManuMania. Ask about Kolkata’s legendary kitchens,
        compare real portion prices, inspect active menu variants, or find dishes near you.
      </p>

      {/* Suggested Prompt Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-10">
        {PROMPT_SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group text-left p-4 rounded-2xl bg-[#14100D]/80 hover:bg-[#1A1410] border border-cream-200/10 hover:border-amber-400/40 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-amber-950/20 flex items-start space-x-3.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-300 group-hover:bg-amber-400/20 group-hover:scale-105 transition-all shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-sans text-sm font-semibold text-cream-100 group-hover:text-amber-200 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-cream-200/60 font-sans mt-0.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

