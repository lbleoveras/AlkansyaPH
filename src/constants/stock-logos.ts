// Real company logos for PSE tickers, fetched live from a favicon service
// rather than bundled as assets. Only covers the ~30 curated, PSEi-heavy
// tickers that already have hand-curated sector/market-cap data (see
// CLAUDE.md) -- every domain below was verified to resolve to a real,
// non-generic favicon before being added (checked via response size against
// the service's known ~726-byte fallback icon). Tickers with no entry here
// simply keep the initials badge; AvatarBadge also falls back to initials
// at runtime if a fetch ever fails.
export const STOCK_LOGO_DOMAINS: Record<string, string> = {
  AC: 'ayalacorp.com',
  ACEN: 'acenrenewables.com',
  AEV: 'aboitiz.com',
  ALI: 'ayalaland.com.ph',
  AP: 'aboitizpower.com',
  BDO: 'bdo.com.ph',
  BPI: 'bpi.com.ph',
  CEB: 'cebupacificair.com',
  CNPF: 'centurypacific.com.ph',
  COL: 'colfinancial.com',
  DMC: 'dmciholdings.com',
  DNL: 'dnl.com.ph',
  EMI: 'emperadorinc.com',
  FGEN: 'firstgen.com',
  GLO: 'globe.com.ph',
  GTCAP: 'gtcapital.com.ph',
  ICT: 'ictsi.com',
  JFC: 'jollibee.com.ph',
  JGS: 'jgsummit.com.ph',
  LTG: 'ltg.com.ph',
  MBT: 'metrobank.com.ph',
  MER: 'meralco.com',
  MONDE: 'mondenissin.com',
  MPI: 'metropacific.com',
  PGOLD: 'puregold.com.ph',
  SECB: 'securitybank.com',
  SM: 'sm-investments.com',
  SMPH: 'smprime.com',
  TEL: 'pldt.com',
  URC: 'urc.com.ph',
  WLCON: 'wilcon.com.ph',
};

export function getStockLogoUrl(symbol: string): string | undefined {
  const domain = STOCK_LOGO_DOMAINS[symbol];
  if (!domain) return undefined;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
