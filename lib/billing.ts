export const FREE_TRIAL_GENERATIONS = 2;

export type CreditPlan = {
  id: string;
  name: string;
  credits: number;
  priceKes: number;
  description: string;
  popular?: boolean;
};

// Suggested launch pricing. Change these values before production launch.
export const CREDIT_PLANS: CreditPlan[] = [
  { id: 'starter', name: 'Starter', credits: 100, priceKes: 500, description: 'For trying several short projects' },
  { id: 'creator', name: 'Creator', credits: 500, priceKes: 2000, description: 'For regular YouTube production', popular: true },
  { id: 'studio', name: 'Studio', credits: 1500, priceKes: 5000, description: 'For frequent long-form production' },
];

/** Suggested generation cost model for the MVP. 1 credit ≈ one minute of planned video. */
export function generationCost(durationMinutes: number) {
  return Math.max(1, Math.ceil(durationMinutes));
}
