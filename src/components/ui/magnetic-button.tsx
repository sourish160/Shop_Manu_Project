import React, { useRef } from 'react';
import { motion, useSpring, useReducedMotion, type HTMLMotionProps } from 'motion/react';

export interface MagneticButtonProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  maxDistance?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  disabled?: boolean;
}

/**
 * MagneticButton component
 * Subtly attracts the wrapped button towards the cursor position on hover.
 * - Restrained physical movement (~5-8px)
 * - Spring-based momentum and smooth return-to-center
 * - Fully accessible: disables movement for touchscreens & prefers-reduced-motion
 * - Does not produce invalid nested buttons or duplicate event handlers
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  maxDistance = 7,
  springConfig = { damping: 16, stiffness: 220, mass: 0.12 },
  disabled = false,
  style,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  // Smooth springs for horizontal and vertical magnetic displacement
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || prefersReduced || e.pointerType === 'touch') return;
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    const normalizedX = distanceX / (rect.width / 2);
    const normalizedY = distanceY / (rect.height / 2);

    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));

    x.set(clampedX * maxDistance);
    y.set(clampedY * maxDistance);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      style={{ x, y, ...style }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`inline-flex items-center justify-center will-change-transform ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
