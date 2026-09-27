<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# przerobmizdjecie.pl

AI-owy generator wizualizacji ogrodów i domów. Front (React + Vite) rozmawia
wyłącznie z Supabase (auth, baza kredytów) i z Edge Function `ai-proxy`, która
po stronie serwera woła OpenAI (GPT-4o-mini do analizy zdjęcia, `gpt-image-1`
do generowania). Żaden klucz API providera AI nie trafia do przeglądarki.

## Architektura

- **Frontend** (`App.tsx`, `components/`) — UI, nie zna żadnych kluczy AI.
- **Supabase Auth** — logowanie e-mail + hasło, sesja w `supabase-js`.
- **Supabase Postgres** — tabela `profiles` (kredyty użytkownika, start: 5) i
  `generations` (log wywołań). RLS: użytkownik widzi tylko swoje rekordy.
  Funkcje `consume_credit` / `refund_credit` / `add_credits` wykonywalne
  wyłącznie przez `service_role` (nie da się ich wywołać z przeglądarki).
- **Supabase Edge Function `ai-proxy`** (`supabase/functions/ai-proxy`) —
  weryfikuje sesję użytkownika, atomowo zdejmuje kredyt, woła OpenAI i zwraca
  wynik. Klucz `OPENAI_API_KEY` żyje tylko tutaj, jako sekret Edge Function.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. `.env.local` zawiera `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`
   (klucz publiczny, bezpieczny do trzymania w kliencie) — już skonfigurowane
   dla projektu Supabase `przerobmizdjecie`.
3. W panelu Supabase → Project Settings → Edge Functions → Secrets ustaw
   `OPENAI_API_KEY` (klucz OpenAI z dostępem do `gpt-4o-mini` i `gpt-image-1`).
   Bez tego generowanie i analiza zwrócą błąd `SERVER_NOT_CONFIGURED`.
4. Run the app:
   `npm run dev`

## Co dalej

- Logowanie Google (OAuth) można dołożyć w Supabase Auth Providers, gdy
  będzie gotowy Google Cloud OAuth Client ID/Secret.
- Płatności (Stripe) nie są jeszcze podpięte — `PricingModal` kieruje na razie
  na e-mail kontaktowy zamiast fałszywie doładowywać kredyty.
