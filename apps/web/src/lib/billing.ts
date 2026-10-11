import { postJson } from "./api";

export type PaidPlan = "pro" | "team";

// Asks the API for a Bachs hosted checkout and returns the URL to send people to.
export async function startCheckout(plan: PaidPlan): Promise<string> {
  const { url } = await postJson<{ url: string }>("/api/billing/checkout", { plan });
  return url;
}
