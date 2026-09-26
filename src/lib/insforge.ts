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
