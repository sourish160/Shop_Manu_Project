import { createClient } from '@insforge/sdk';

export const INSFORGE_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSFORGE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_INSFORGE_URL) ||
  'https://yke9qwgm.us-east.insforge.app';

export const INSFORGE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_INSFORGE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_INSFORGE_ANON_KEY) ||
  'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

export const insforge = createClient({
  baseUrl: INSFORGE_BASE_URL,
  anonKey: INSFORGE_ANON_KEY,
});

export type UserRole = 'customer' | 'owner' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  address: string;
  area: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified: boolean;
  admin_notes?: string | null;
  logo_url: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FoodVariant {
  id: string;
  food_id: string;
  name: string;
  price: number;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  veg_type: 'veg' | 'non_veg';
  available: boolean;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  variants?: FoodVariant[];
  category?: Category;
}

export interface PriceHistory {
  id: string;
  food_variant_id: string;
  old_price: number;
  new_price: number;
  changed_by: string | null;
  changed_at: string;
}

export interface RestaurantHours {
  id: string;
  restaurant_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantReport {
  id: string;
  restaurant_id: string;
  food_id?: string | null;
  report_type: 'wrong_price' | 'food_unavailable' | 'incorrect_info' | 'restaurant_closed' | 'incorrect_location' | 'other';
  details?: string | null;
  reporter_email?: string | null;
  user_id?: string | null;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  resolution_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface AdminMetrics {
  pending_restaurants: number;
  approved_restaurants: number;
  rejected_restaurants: number;
  suspended_restaurants: number;
  open_reports: number;
  resolved_reports: number;
  stale_menu_count: number;
  total_foods: number;
  total_audit_logs: number;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'owner';
}

/**
 * Register a shop owner via the secure InsForge serverless edge function.
 * Validates inputs server-side, restricts roles exclusively to owner,
 * auto-verifies email, and sets up owner profile.
 */
export async function registerUser(payload: RegisterPayload) {
  const { data, error } = await insforge.functions.invoke('register-user', {
    body: {
      ...payload,
      role: 'owner',
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to complete shop owner registration');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

/**
 * Upload an image to the InsForge 'restaurant-media' storage bucket.
 * Validates file type and size.
 */
export async function uploadMediaImage(file: File): Promise<{ url: string; key: string }> {
  // Enforce authenticated session for upload
  const { data: userData, error: userError } = await insforge.auth.getCurrentUser();
  if (userError || !userData?.user) {
    throw new Error('Authentication required to upload media.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    throw new Error('Image file is too large. Maximum size is 5 MB.');
  }

  // Prevent path traversal or unsafe file names
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeFile = new File([file], sanitizedName, { type: file.type });

  const { data, error } = await insforge.storage
    .from('restaurant-media')
    .uploadAuto(safeFile);

  if (error || !data) {
    throw new Error(error?.message || 'Failed to upload image.');
  }

  return {
    url: data.url,
    key: data.key,
  };
}

/**
 * Update restaurant status via secure, audited admin RPC function.
 * Enforces server-side is_admin() privilege check and logs audit entry.
 */
export async function adminUpdateRestaurantStatus(
  restaurantId: string,
  newStatus: 'pending' | 'approved' | 'rejected' | 'suspended',
  verified: boolean = false,
  adminNotes?: string | null
): Promise<any> {
  const { data, error } = await insforge.database.rpc('admin_update_restaurant_status', {
    p_restaurant_id: restaurantId,
    p_new_status: newStatus,
    p_verified: verified,
    p_admin_notes: adminNotes || null,
  });

  if (error) {
    throw new Error(error.message || 'Failed to update restaurant status');
  }

  return data;
}

/**
 * Update report status and resolution notes via secure, audited admin RPC function.
 * Enforces server-side is_admin() privilege check and logs audit entry.
 */
export async function adminUpdateReportStatus(
  reportId: string,
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed',
  resolutionNotes?: string | null
): Promise<any> {
  const { data, error } = await insforge.database.rpc('admin_update_report_status', {
    p_report_id: reportId,
    p_status: status,
    p_resolution_notes: resolutionNotes || null,
  });

  if (error) {
    throw new Error(error.message || 'Failed to update report status');
  }

  return data;
}

/**
 * Fetch real, database-backed administrative metrics.
 * Enforces server-side is_admin() check.
 */
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const { data, error } = await insforge.database.rpc('get_admin_metrics');

  if (error) {
    throw new Error(error.message || 'Failed to load admin metrics');
  }

  return data as AdminMetrics;
}

