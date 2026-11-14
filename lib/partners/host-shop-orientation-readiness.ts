import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

export function missingHostShopRegisteredStandards(board: {
  registeredPrograms: Array<{ programSlug?: string | null }>;
  tradeInfo: { registered: boolean; programSlug?: string | null };
}): string[] {
  const slugs = board.registeredPrograms.map((item) => item.programSlug);
  if (board.tradeInfo.registered) slugs.push(board.tradeInfo.programSlug);
  return [...new Set(slugs.filter((slug): slug is string => Boolean(slug)))].filter(
    (slug) => !getRegisteredProgramStandard(slug),
  );
}
