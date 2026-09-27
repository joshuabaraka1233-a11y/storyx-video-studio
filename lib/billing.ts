export const FREE_TRIAL_GENERATIONS = 2;

export const CREDIT_PLANS = [
  { id: 'starter', name: 'Starter', credits: 100, priceKes: 500, description: 'For trying several short projects' },
  { id: 'creator', name: 'Creator', credits: 500, priceKes: 2000, description: 'For regular YouTube production', popular: true },
  { id: 'studio', name: 'Studio', credits: 1500, priceKes: 5000, description: 'For frequent long-form production' },
];

export function generationCost(minutes: number) {
  return Math.max(1, Math.ceil(minutes));
}
