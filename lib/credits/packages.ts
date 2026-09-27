export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  characterSlots: number;
  amountHuf: number;
};

const FALLBACK_PACKAGES: CreditPackage[] = [
  { id: 'starter', name: 'Starter', credits: 30, characterSlots: 0, amountHuf: 2490 },
  { id: 'creator', name: 'Creator', credits: 75, characterSlots: 1, amountHuf: 4990 },
  { id: 'studio', name: 'Studio', credits: 200, characterSlots: 2, amountHuf: 9990 },
  { id: 'pro', name: 'Pro', credits: 500, characterSlots: 5, amountHuf: 19990 },
  { id: 'big', name: 'Big', credits: 1000, characterSlots: 10, amountHuf: 34990 },
];

export function getCreditPackages(): CreditPackage[] {
  const raw = process.env.CREDIT_PACKAGES_JSON;
  if (!raw) return FALLBACK_PACKAGES;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return FALLBACK_PACKAGES;

    return parsed
      .map((item) => ({
        id: String(item?.id || '').trim(),
        name: String(item?.name || '').trim(),
        credits: Number(item?.credits),
        characterSlots: Number(item?.characterSlots || 0),
        amountHuf: Number(item?.amountHuf),
      }))
      .filter((item) =>
        item.id &&
        item.name &&
        Number.isInteger(item.credits) &&
        item.credits > 0 &&
        Number.isInteger(item.characterSlots) &&
        item.characterSlots >= 0 &&
        Number.isInteger(item.amountHuf) &&
        item.amountHuf > 0
      );
  } catch {
    return FALLBACK_PACKAGES;
  }
}
