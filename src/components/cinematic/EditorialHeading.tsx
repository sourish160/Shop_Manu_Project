import React from 'react';

interface EditorialHeadingProps {
  eyebrow?: string;
  chapterNumber?: string;
  title: string;
  italicWord?: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const EditorialHeading: React.FC<EditorialHeadingProps> = ({
  eyebrow,
  chapterNumber,
  title,
  italicWord,
  subtitle,
  align = 'left',
  size = 'lg',
  className = '',
}) => {
  const alignClass =
    align === 'center'
      ? 'text-center mx-auto items-center'
      : align === 'right'
      ? 'text-right ml-auto items-end'
      : 'text-left items-start';

  const titleSizeClass =
    size === 'xl'
      ? 'text-4xl sm:text-6xl lg:text-[4.75rem]'
      : size === 'lg'
      ? 'text-3xl sm:text-5xl lg:text-6xl'
      : size === 'md'
      ? 'text-2xl sm:text-3xl lg:text-4xl'
      : 'text-xl sm:text-2xl';

  // Renders text with optional italicized words wrapped in asterisks or matching italicWord
  const renderFormattedTitle = () => {
    // If title has *word* markers
    if (title.includes('*')) {
      const parts = title.split('*');
      return parts.map((part, index) => {
        // Odd indices are between asterisks
        if (index % 2 === 1) {
          return (
            <span
              key={index}
              className="italic font-serif font-normal bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent inline-block transition-all"
              style={{
                filter: 'drop-shadow(0 0 24px rgba(251, 191, 36, 0.35))',
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      });
    }

    if (italicWord && title.includes(italicWord)) {
      const parts = title.split(italicWord);
      return (
        <>
          {parts[0]}
          <span
            className="italic font-serif font-normal bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent inline-block transition-all"
            style={{
              filter: 'drop-shadow(0 0 24px rgba(251, 191, 36, 0.35))',
            }}
          >
            {italicWord}
          </span>
          {parts[1]}
        </>
      );
    }

    return title;
  };

  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      {/* Chapter / Eyebrow badge */}
      {(eyebrow || chapterNumber) && (
        <div className="flex items-center space-x-2.5 mb-4 sm:mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="chapter-label text-[10px] sm:text-[11px] text-amber-400">
            {chapterNumber ? `Chapter ${chapterNumber} — ${eyebrow}` : eyebrow}
          </span>
        </div>
      )}

      {/* Main serif headline */}
      <h2
        className={`font-serif font-normal tracking-tight leading-[1.08] text-cream-100 ${titleSizeClass} drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]`}
      >
        {renderFormattedTitle()}
      </h2>

      {/* Narrative editorial paragraph */}
      {subtitle && (
        <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-cream-200/70 font-sans leading-relaxed max-w-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
};
