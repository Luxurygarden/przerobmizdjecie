import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";
import { PLANS, isPlanId } from "../_shared/plans.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://luxurygarden.github.io/przerobmizdjecie/";

// Only these origins may be used as post-payment return targets (prevents open redirects).
const ALLOWED_RETURN_PREFIXES = [SITE_URL, "http://localhost:3000/", "http://localhost:5173/"];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!STRIPE_SECRET_KEY) {
    return jsonResponse({ error: "SERVER_NOT_CONFIGURED", message: "STRIPE_SECRET_KEY not set" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "UNAUTHORIZED" }, 401);

  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) return jsonResponse({ error: "UNAUTHORIZED" }, 401);
  const user = userData.user;

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "INVALID_BODY" }, 400);
  }

  const { planId, returnUrl } = payload ?? {};
  if (!isPlanId(planId)) return jsonResponse({ error: "INVALID_PLAN" }, 400);
  const plan = PLANS[planId];

  const base =
    typeof returnUrl === "string" && ALLOWED_RETURN_PREFIXES.some((p) => returnUrl.startsWith(p))
      ? returnUrl.split("?")[0].split("#")[0]
      : SITE_URL;

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

  try {
    // payment_method_types is omitted on purpose: the methods enabled in the Stripe
    // dashboard (card, BLIK, Apple Pay, Google Pay) are offered automatically.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "pl",
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "pln",
            unit_amount: plan.amountGrosze,
            product_data: { name: plan.name },
          },
        },
      ],
      metadata: { user_id: user.id, plan_id: planId },
      payment_intent_data: { metadata: { user_id: user.id, plan_id: planId } },
      success_url: `${base}?payment=success`,
      cancel_url: `${base}?payment=cancelled`,
    });

    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "CHECKOUT_FAILED", message: String((err as Error)?.message ?? err) }, 500);
  }
});
