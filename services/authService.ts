import type { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { supabase } from './supabaseClient';

const NEW_USER_CREDITS = 5;

const displayName = (user: User): string => {
  const meta = user.user_metadata || {};
  return meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'Użytkownik');
};

const avatarFor = (user: User): string => {
  const meta = user.user_metadata || {};
  return (
    meta.avatar_url ||
    meta.picture ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`
  );
};

/**
 * Loads the user's profile row (holding their credits), creating it with a
 * signup bonus the first time they log in.
 */
const ensureProfile = async (user: User): Promise<UserProfile> => {
  const name = displayName(user);
  const avatarUrl = avatarFor(user);
  const email = user.email || '';

  const { data: existing, error } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url, credits')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[v0] Failed to load profile', error);
  }

  if (existing) {
    return {
      id: existing.id,
      name: existing.name || name,
      email: existing.email || email,
      avatarUrl: existing.avatar_url || avatarUrl,
      credits: existing.credits ?? 0,
    };
  }

  // New user: create their profile with the signup bonus.
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name,
      email,
      avatar_url: avatarUrl,
      credits: NEW_USER_CREDITS,
    })
    .select('id, name, email, avatar_url, credits')
    .single();

  if (insertError || !inserted) {
    console.error('[v0] Failed to create profile', insertError);
    return { id: user.id, name, email, avatarUrl, credits: NEW_USER_CREDITS };
  }

  return {
    id: inserted.id,
    name: inserted.name,
    email: inserted.email,
    avatarUrl: inserted.avatar_url,
    credits: inserted.credits,
  };
};

const profileFromSession = async (session: Session | null): Promise<UserProfile | null> => {
  if (!session?.user) return null;
  return ensureProfile(session.user);
};

export const authService = {
  loginWithGoogle: async (): Promise<void> => {
    const redirectTo = process.env.SUPABASE_REDIRECT_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    const { data } = await supabase.auth.getSession();
    return profileFromSession(data.session);
  },

  /**
   * Subscribes to auth changes. Fires with the mapped profile (or null on
   * logout). Returns an unsubscribe function.
   */
  onAuthChange: (callback: (user: UserProfile | null) => void): (() => void) => {
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      callback(await profileFromSession(session));
    });
    return () => data.subscription.unsubscribe();
  },

  updateCredits: async (userId: string, amountToAdd: number): Promise<UserProfile> => {
    const { data: current, error: readError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (readError || !current) {
      throw new Error('User not found');
    }

    const nextCredits = Math.max(0, (current.credits ?? 0) + amountToAdd);

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ credits: nextCredits })
      .eq('id', userId)
      .select('id, name, email, avatar_url, credits')
      .single();

    if (updateError || !updated) {
      throw new Error('Failed to update credits');
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatar_url,
      credits: updated.credits,
    };
  },
};
