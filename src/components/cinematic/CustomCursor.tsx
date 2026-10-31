import React, { useEffect, useState, useRef, useCallback } from 'react';

type CursorMode = 'default' | 'hover' | 'view' | 'text';

/**
 * Premium Custom Mouse Cursor for ManuMania
 * - Default: refined warm orange circle (#E8A856) with crisp white center dot
 * - Hover: smoothly expands on buttons, links, and clickable controls
 * - View: expands into an editorial circle with "VIEW" badge when hovering menu/food cards
 * - Motion: 120fps RAF spring-lerp trailing for outer ring + zero-latency tracking for center dot
 * - Accessibility: hides on touch/tablet, respects prefers-reduced-motion, unobtrusive on text inputs
 */
export const CustomCursor: React.FC = () => {
  const [isFinePointer, setIsFinePointer] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  });

  const [isVisible, setIsVisible] = useState(false);
  const [cursorMode, setCursorMode] = useState<CursorMode>('default');
  const [isClicking, setIsClicking] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Position coordinates for RAF loop
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const isInitializedRef = useRef(false);
  const rafId = useRef<number | null>(null);

  // Responsive device capability detection
  useEffect(() => {
    const checkFinePointer = () => {
      const match = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      setIsFinePointer(match);
    };

    checkFinePointer();
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    mediaQuery.addEventListener('change', checkFinePointer);

    return () => {
      mediaQuery.removeEventListener('change', checkFinePointer);
    };
  }, []);

  // Synchronize body class with custom cursor visibility
  useEffect(() => {
    if (!isFinePointer) return;

    if (isVisible && cursorMode !== 'text') {
      document.body.classList.add('has-custom-cursor');
    } else {
      document.body.classList.remove('has-custom-cursor');
    }

    return () => {
      document.body.classList.remove('has-custom-cursor');
    };
  }, [isFinePointer, isVisible, cursorMode]);

  // Main animation frame loop for fluid trailing motion
  useEffect(() => {
    if (!isFinePointer) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lerpFactor = prefersReducedMotion ? 1.0 : 0.22;

    const render = () => {
      if (dotRef.current && ringRef.current) {
        // Immediate position for center dot (zero latency, pinpoint precision)
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;

        // Smooth spring-lerp for outer ring
        ringPos.current.x += (mousePos.current.x - ringPos.current.x) * lerpFactor;
        ringPos.current.y += (mousePos.current.y - ringPos.current.y) * lerpFactor;

        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(render);
    };

    rafId.current = requestAnimationFrame(render);

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isFinePointer]);

  // Determine element type under cursor
  const updateCursorTarget = useCallback((target: HTMLElement | null) => {
    if (!target) {
      setCursorMode('default');
      return;
    }

    // 1. Text input or editable area: let native I-beam cursor shine
    if (
      target.closest(
        'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
      )
    ) {
      setCursorMode('text');
      return;
    }

    // 2. Explicit data-cursor attribute override
    const explicitCursor = target.closest('[data-cursor]') as HTMLElement | null;
    if (explicitCursor) {
      const mode = explicitCursor.getAttribute('data-cursor');
      if (mode === 'view') {
        setCursorMode('view');
        return;
      }
      if (mode === 'hover' || mode === 'pointer') {
        setCursorMode('hover');
        return;
      }
      if (mode === 'text' || mode === 'hidden') {
        setCursorMode('text');
        return;
      }
    }

    // 3. Menu cards / food cards / shop cards / craving cards
    const cardEl = target.closest(
      '#chapter-menu .group, #chapter-craving .group, #chapter-shops .group, #chapter-next-bite .group, #chapter-gallery .group, .editorial-card, .food-card, .velluto-card, [data-card]'
    );
    if (cardEl) {
      setCursorMode('view');
      return;
    }

    // 4. Clickable interactive elements (buttons, links, nav items, pills, controls)
    const interactiveEl = target.closest(
      'a, button, [role="button"], input[type="submit"], input[type="button"], select, summary, [data-cursor="pointer"], .cursor-pointer'
    );
    if (interactiveEl) {
      setCursorMode('hover');
      return;
    }

    // 5. Default
    setCursorMode('default');
  }, []);

  // Event listeners for window interactions
  useEffect(() => {
    if (!isFinePointer) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      if (!isInitializedRef.current) {
        ringPos.current = { x: e.clientX, y: e.clientY };
        isInitializedRef.current = true;
      }

      if (!isVisible) {
        setIsVisible(true);
      }

      updateCursorTarget(e.target as HTMLElement | null);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    const handleWindowBlur = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isFinePointer, isVisible, updateCursorTarget]);

  if (!isFinePointer) return null;

  // Visual appearance styles
  let ringClasses = '';
  let dotClasses = '';
  let showViewText = false;

  switch (cursorMode) {
    case 'text':
      ringClasses = 'w-0 h-0 opacity-0 pointer-events-none scale-0';
      dotClasses = 'opacity-0 scale-0';
      break;

    case 'view':
      ringClasses = `w-[54px] h-[54px] -ml-[27px] -mt-[27px] rounded-full border border-amber-400/90 bg-[#0A0807]/85 backdrop-blur-md shadow-[0_0_16px_rgba(232,168,86,0.28)] ${
        isClicking ? 'scale-90' : 'scale-100'
      }`;
      dotClasses = 'opacity-0 scale-0';
      showViewText = true;
      break;

    case 'hover':
      ringClasses = `w-[34px] h-[34px] -ml-[17px] -mt-[17px] rounded-full border border-amber-400 bg-amber-400/15 shadow-[0_0_12px_rgba(245,158,11,0.25)] ${
        isClicking ? 'scale-[0.85]' : 'scale-100'
      }`;
      dotClasses = `w-1 h-1 -ml-[2px] -mt-[2px] rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.95)] ${
        isClicking ? 'scale-75' : 'scale-100'
      }`;
      break;

    case 'default':
    default:
      ringClasses = `w-[22px] h-[22px] -ml-[11px] -mt-[11px] rounded-full border border-[#E8A856]/80 bg-[#E8A856]/10 shadow-[0_0_8px_rgba(232,168,86,0.2)] ${
        isClicking ? 'scale-75' : 'scale-100'
      }`;
      dotClasses = `w-1 h-1 -ml-[2px] -mt-[2px] rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.95)] ${
        isClicking ? 'scale-75' : 'scale-100'
      }`;
      break;
  }

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-[9999] select-none transition-opacity duration-200 ${
        isVisible && cursorMode !== 'text' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Outer Smoothed Ring (Smooth Spring-Lerp Trailing) */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform"
      >
        <div
          className={`flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${ringClasses}`}
        >
          {showViewText && (
            <span className="font-mono text-[9px] tracking-[0.2em] font-bold text-amber-300 uppercase transition-opacity duration-200 select-none">
              VIEW
            </span>
          )}
        </div>
      </div>

      {/* Tiny White Center Dot (Zero-Latency Pinpoint Tracking) */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none will-change-transform"
      >
        <div
          className={`transition-all duration-200 ease-out ${dotClasses}`}
        />
      </div>
    </div>
  );
};

