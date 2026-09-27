export type UserPlan = 'free' | 'paid' | 'admin';

export type UserEntitlements = {
  plan: UserPlan;
  generationCredits: number;
  characterSlots: number;
};

export function isPaidPlan(plan: UserPlan): boolean {
  return plan === 'paid' || plan === 'admin';
}
