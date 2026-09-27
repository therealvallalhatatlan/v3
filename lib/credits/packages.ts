export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  characterSlots: number;
  amountHuf: number;
};

const DEFAULT_PACKAGES: CreditPackage[] = [
  { id: 'starter', name: 'Starter', credits: 30, characterSlots: 0, amountHuf: 2490 },
  { id: 'creator', name: 'Creator', credits: 75, characterSlots: 1, amountHuf: 4990 },
  { id: 'studio', name: 'Studio', credits: 200, characterSlots: 2, amountHuf: 9990 },
  { id: 'pro', name: 'Pro', credits: 500, characterSlots: 5, amountHuf: 19990 },
  { id: 'big', name: 'Big', credits: 1000, characterSlots: 10, amountHuf: 34990 },
];

const MIN_STRIPE_AMOUNT_HUF = 175;

export function getCreditPackages(): CreditPackage[] {
  const raw = process.env.CREDIT_PACKAGES_JSON;
  if (!raw) return DEFAULT_PACKAGES;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PACKAGES;

    const parsedPackages = parsed
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
        item.amountHuf >= MIN_STRIPE_AMOUNT_HUF
      );

    if (parsedPackages.length === parsed.length) return parsedPackages;

    const parsedById = new Map(parsedPackages.map((item) => [item.id, item]));

    return DEFAULT_PACKAGES.map((fallback) => parsedById.get(fallback.id) || fallback);
  } catch {
    return DEFAULT_PACKAGES;
  }
}
