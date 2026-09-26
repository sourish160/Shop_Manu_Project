import { createClient } from '@insforge/sdk';

export const INSFORGE_BASE_URL = 'https://yke9qwgm.us-east.insforge.app';
export const INSFORGE_ANON_KEY = 'anon_bac4f2f309bfaf91f6cae59f0b1fd1edb6cc54edb32e39bd92df9c2b3b539215';

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

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'customer' | 'owner';
}

/**
 * Register a user via the secure InsForge serverless edge function.
 * Validates inputs server-side, restricts roles to customer/owner,
 * auto-verifies email, and sets up profile.
 */
export async function registerUser(payload: RegisterPayload) {
  const { data, error } = await insforge.functions.invoke('register-user', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || 'Failed to complete registration');
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
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    throw new Error('Image file is too large. Maximum size is 5 MB.');
  }

  const { data, error } = await insforge.storage
    .from('restaurant-media')
    .uploadAuto(file);

  if (error || !data) {
    throw new Error(error?.message || 'Failed to upload image.');
  }

  return {
    url: data.url,
    key: data.key,
  };
}
