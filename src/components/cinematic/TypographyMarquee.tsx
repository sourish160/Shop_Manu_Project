import React from 'react';

export interface MarqueeItem {
  text: string;
  variant?: 'outlined' | 'solid' | 'gold';
  outlined?: boolean;
  accent?: boolean;
}

interface TypographyMarqueeProps {
  items?: MarqueeItem[];
  direction?: 'left' | 'right';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
  separator?: string;
}

const DEFAULT_MARQUEE_ITEMS: MarqueeItem[] = [
  { text: 'DISCOVER FOOD', variant: 'gold' },
  { text: 'LOCAL FAVOURITES', variant: 'outlined' },
  { text: 'MENUS AND PRICES', variant: 'solid' },
  { text: 'YOUR NEXT BITE', variant: 'gold' },
  { text: 'CAST IRON & SMOKE', variant: 'outlined' },
  { text: 'ZERO COMMISSION MARKUPS', variant: 'solid' },
  { text: 'VERIFIED KITCHENS', variant: 'gold' },
  { text: 'REAL PORTION PRICES', variant: 'outlined' },
];

export const TypographyMarquee: React.FC<TypographyMarqueeProps> = ({
  items = DEFAULT_MARQUEE_ITEMS,
  direction = 'left',
  className = '',
  separator = '✦',
}) => {
  const animClass =
    direction === 'right' ? 'animate-marquee-right' : 'animate-marquee-left';

  // Duplicate items twice for seamless continuous scroll loop
  const duplicatedItems = [...items, ...items];

  return (
    <div
      aria-hidden="true"
      className={`relative w-full overflow-hidden select-none py-5 sm:py-7 border-y border-cream-200/10 bg-[#0A0807]/90 backdrop-blur-md ${className}`}
    >
      <div className={animClass}>
        {duplicatedItems.map((item, index) => {
          const isGold = item.variant === 'gold' || item.accent;
          const isOutlined = item.variant === 'outlined' || (item.outlined && !item.accent);

          let typographyClass = 'text-cream-100/90 font-light';
          if (isGold) {
            typographyClass = 'text-amber-300 font-normal';
          } else if (isOutlined) {
            typographyClass = 'text-stroke-cream hover:text-cream-100 transition-colors duration-300';
          }

          return (
            <div key={index} className="flex items-center space-x-6 sm:space-x-10 mx-3 sm:mx-6">
              <span
                className={`font-serif tracking-widest text-2xl sm:text-4xl lg:text-5xl uppercase whitespace-nowrap ${typographyClass}`}
              >
                {item.text}
              </span>
              <span className="text-amber-400/50 text-xs sm:text-sm font-serif select-none" aria-hidden="true">
                {separator}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
