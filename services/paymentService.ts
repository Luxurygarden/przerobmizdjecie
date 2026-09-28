import { supabase } from './supabaseClient';

export type PlanId = 'start' | 'pro' | 'biznes';

export const startCheckout = async (planId: PlanId): Promise<void> => {
  const returnUrl = window.location.origin + window.location.pathname;
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { planId, returnUrl },
  });

  if (error || !data?.url) {
    throw new Error('CHECKOUT_FAILED');
  }

  window.location.href = data.url as string;
};
