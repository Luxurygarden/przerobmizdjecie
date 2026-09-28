// Single source of truth for prices — the client only sends a plan id.
export const PLANS = {
  start: { name: "Pakiet Start — 5 wizualizacji", credits: 5, amountGrosze: 1900 },
  pro: { name: "Pakiet Pro — 25 wizualizacji", credits: 25, amountGrosze: 4900 },
  biznes: { name: "Pakiet Biznes — 100 wizualizacji", credits: 100, amountGrosze: 14900 },
} as const;

export type PlanId = keyof typeof PLANS;

export const isPlanId = (value: unknown): value is PlanId =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(PLANS, value);
