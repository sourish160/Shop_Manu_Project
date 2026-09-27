/**
 * Menu and Price Freshness Classification Utility
 * Phase 7: Freshness Monitoring & Management
 *
 * Implements configurable freshness thresholds in a single centralized location:
 * - 0 to 30 days: Fresh
 * - 31 to 60 days: Review recommended
 * - 60+ days: Stale
 *
 * All freshness metrics derive strictly from database timestamps (updated_at).
 * Never uses fake dates or synthetic guarantees.
 */

export interface FreshnessConfig {
  freshDays: number;
  reviewRecommendedDays: number;
}

export const DEFAULT_FRESHNESS_CONFIG: FreshnessConfig = {
  freshDays: 30,
  reviewRecommendedDays: 60,
};

export type FreshnessStatus = 'fresh' | 'review_recommended' | 'stale';

/**
 * Calculates freshness status based on the item's updated_at timestamp.
 */
export function getFreshnessStatus(
  updatedAt: string | Date | null | undefined,
  config: FreshnessConfig = DEFAULT_FRESHNESS_CONFIG
): FreshnessStatus {
  if (!updatedAt) return 'stale';
  const now = Date.now();
  const updatedTime = new Date(updatedAt).getTime();
  if (isNaN(updatedTime)) return 'stale';

  const diffMs = now - updatedTime;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= config.freshDays) {
    return 'fresh';
  }
  if (diffDays <= config.reviewRecommendedDays) {
    return 'review_recommended';
  }
  return 'stale';
}

/**
 * Formats a timestamp into a clean, human-readable date.
 * Example: "24 Sep 2026"
 */
export function formatFreshnessDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'Date not recorded';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Date not recorded';

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Returns human-readable freshness badge label and color styling.
 */
export function getFreshnessBadge(
  updatedAt: string | Date | null | undefined,
  config: FreshnessConfig = DEFAULT_FRESHNESS_CONFIG
): {
  status: FreshnessStatus;
  label: string;
  className: string;
} {
  const status = getFreshnessStatus(updatedAt, config);

  switch (status) {
    case 'fresh':
      return {
        status: 'fresh',
        label: 'Fresh',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'review_recommended':
      return {
        status: 'review_recommended',
        label: 'Review recommended',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'stale':
    default:
      return {
        status: 'stale',
        label: 'Review needed',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      };
  }
}
