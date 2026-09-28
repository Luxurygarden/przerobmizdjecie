import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";
import { PLANS, isPlanId } from "../_shared/plans.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req: Request) => {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response("Server not configured", { status: 500 });
  }

  const signature = req.headers.get("Stripe-Signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("Signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // BLIK and cards settle immediately (completed + paid); delayed methods arrive later
  // as async_payment_succeeded.
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return new Response("ignored", { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return new Response("not paid yet", { status: 200 });
  }

  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  if (!userId || !isPlanId(planId)) {
    console.error("Missing metadata on session", session.id);
    return new Response("bad metadata", { status: 200 });
  }

  const plan = PLANS[planId];
  if (session.amount_total !== plan.amountGrosze || session.currency !== "pln") {
    console.error("Amount mismatch", session.id, session.amount_total, session.currency);
    return new Response("amount mismatch", { status: 200 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error } = await admin.rpc("fulfill_payment", {
    p_session_id: session.id,
    p_user_id: userId,
    p_plan: planId,
    p_credits: plan.credits,
    p_amount: session.amount_total,
    p_currency: session.currency,
  });

  if (error) {
    console.error("Fulfillment failed", error);
    // Non-2xx makes Stripe retry; fulfill_payment is idempotent per session id.
    return new Response("fulfillment failed", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
