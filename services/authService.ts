import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

const fetchProfile = async (userId: string, email: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, credits')
    .eq('id', userId)
    .single();

  if (error || !data) {
    // Profile row is created by a DB trigger on sign-up; retry once shortly after.
    await new Promise((resolve) => setTimeout(resolve, 500));
    const retry = await supabase.from('profiles').select('id, email, credits').eq('id', userId).single();
    if (retry.error || !retry.data) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    return retry.data as UserProfile;
  }

  return data as UserProfile;
};

export interface SignUpResult {
  user: UserProfile | null;
  needsEmailConfirmation: boolean;
}

export const authService = {
  signUp: async (email: string, password: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('SIGNUP_FAILED');

    // With email confirmation enabled (the default), signUp creates the user
    // but returns no session until they click the link in their inbox.
    if (!data.session) {
      return { user: null, needsEmailConfirmation: true };
    }

    const profile = await fetchProfile(data.user.id, data.user.email ?? email);
    return { user: profile, needsEmailConfirmation: false };
  },

  signIn: async (email: string, password: string): Promise<UserProfile> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('SIGNIN_FAILED');
    return fetchProfile(data.user.id, data.user.email ?? email);
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    try {
      return await fetchProfile(data.user.id, data.user.email ?? '');
    } catch {
      return null;
    }
  },

  refreshCredits: async (userId: string): Promise<UserProfile> => {
    return fetchProfile(userId, '');
  },
};
