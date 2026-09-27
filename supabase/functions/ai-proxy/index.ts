import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function analyzeImage(base64Image: string, mimeType: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Jesteś ekspertem od architektury krajobrazu i fotografii. Przeanalizuj to zdjęcie.
Odpowiedz w formacie Markdown, dwie krótkie sekcje:

1. **Co widzę**: krótki, rzeczowy opis (styl domu, rodzaj ogrodu, oświetlenie, kluczowe elementy).
2. **Sugestie do promptu**: konkretne rady jak opisać zmianę, żeby uzyskać fotorealistyczny efekt. Wymień 3-4 słowa kluczowe oraz na co zwrócić uwagę (np. perspektywa, światło).`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OPENAI_ANALYZE_ERROR: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "Nie udało się wygenerować opisu.";
}

async function generateImage(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  const form = new FormData();
  form.append("model", "gpt-image-2.5-sunburst-2026-09-08");
  form.append("prompt", `Transform the attached image based on this description: ${prompt}. Keep it photorealistic.`);
  form.append("size", "1024x1024");
  form.append("image", new Blob([base64ToBytes(base64Image)], { type: mimeType }), "input.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OPENAI_GENERATE_ERROR: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("NO_IMAGE_DATA");
  return `data:image/png;base64,${b64}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!OPENAI_API_KEY) {
    return jsonResponse({ error: "SERVER_NOT_CONFIGURED", message: "OPENAI_API_KEY not set" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "UNAUTHORIZED" }, 401);
  }

  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "UNAUTHORIZED" }, 401);
  }
  const userId = userData.user.id;

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "INVALID_BODY" }, 400);
  }

  const { action, imageBase64, mimeType, prompt } = payload ?? {};

  if (!imageBase64 || !mimeType) {
    return jsonResponse({ error: "MISSING_IMAGE" }, 400);
  }

  try {
    if (action === "analyze") {
      const analysis = await analyzeImage(imageBase64, mimeType);
      return jsonResponse({ analysis });
    }

    if (action === "generate") {
      if (!prompt || !String(prompt).trim()) {
        return jsonResponse({ error: "MISSING_PROMPT" }, 400);
      }

      const { error: creditError } = await adminClient.rpc("consume_credit", { p_user_id: userId });
      if (creditError) {
        return jsonResponse({ error: "INSUFFICIENT_CREDITS" }, 402);
      }

      const { data: genRow } = await adminClient
        .from("generations")
        .insert({ user_id: userId, prompt, status: "pending" })
        .select("id")
        .single();

      try {
        const resultImage = await generateImage(imageBase64, mimeType, prompt);
        if (genRow?.id) {
          await adminClient.from("generations").update({ status: "done" }).eq("id", genRow.id);
        }
        return jsonResponse({ resultImage });
      } catch (genErr) {
        await adminClient.rpc("refund_credit", { p_user_id: userId });
        if (genRow?.id) {
          await adminClient.from("generations").update({ status: "failed" }).eq("id", genRow.id);
        }
        throw genErr;
      }
    }

    return jsonResponse({ error: "UNKNOWN_ACTION" }, 400);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "GENERATION_FAILED", message: String(err?.message ?? err) }, 500);
  }
});
