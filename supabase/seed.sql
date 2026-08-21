-- AlkansyaPH: one-time seed for public.stocks
--
-- Seeds the PSEi 30 constituents (plus COL Financial Group as an extra, non-index
-- name already used elsewhere in the app) with symbol, company name, sector, and
-- the PSE Edge internal `cmpy_id` (from edge.pse.com.ph/companyPage/stockData.do?cmpy_id=N),
-- which the scraper Edge Function uses to fetch live data per company.
--
-- price / change_amount / change_percent are seeded as 0 and all other market-data
-- columns (float_million, market_cap_billion, outstanding_shares, etc.) are left NULL
-- on purpose -- the deployed scraper populates real values on its next run.
--
-- Sector note: PSE's actual current PSEi index composition was not independently
-- re-verified against this list beyond spot checks; sectors below follow PSE's own
-- sector classification as used elsewhere in this codebase (Holding Firms, Property,
-- Financials, Industrial, Consumer, Telecommunications).
--
-- Safe to re-run: upserts on symbol (primary key).

insert into public.stocks
  (symbol, company_name, sector, cmpy_id, price, change_amount, change_percent, is_pse_index_member)
values
  ('SM',     'SM Investments Corporation',              'Holding Firms',      599, 0, 0, 0, true),
  ('SMPH',   'SM Prime Holdings, Inc.',                 'Property',           112, 0, 0, 0, true),
  ('BDO',    'BDO Unibank, Inc.',                       'Financials',         260, 0, 0, 0, true),
  ('BPI',    'Bank of the Philippine Islands',          'Financials',         234, 0, 0, 0, true),
  ('ALI',    'Ayala Land, Inc.',                        'Property',           180, 0, 0, 0, true),
  ('AC',     'Ayala Corporation',                       'Holding Firms',       57, 0, 0, 0, true),
  ('AEV',    'Aboitiz Equity Ventures, Inc.',           'Holding Firms',       16, 0, 0, 0, true),
  ('AP',     'Aboitiz Power Corporation',               'Industrial',         609, 0, 0, 0, true),
  ('JFC',    'Jollibee Foods Corporation',              'Consumer',            86, 0, 0, 0, true),
  ('URC',    'Universal Robina Corporation',            'Consumer',           124, 0, 0, 0, true),
  ('TEL',    'PLDT Inc.',                               'Telecommunications',   6, 0, 0, 0, true),
  ('GLO',    'Globe Telecom, Inc.',                     'Telecommunications',  69, 0, 0, 0, true),
  ('ICT',    'International Container Terminal Services, Inc.', 'Industrial',  83, 0, 0, 0, true),
  ('MER',    'Manila Electric Company',                 'Industrial',         118, 0, 0, 0, true),
  ('MBT',    'Metropolitan Bank & Trust Company',       'Financials',         128, 0, 0, 0, true),
  ('SECB',   'Security Bank Corporation',               'Financials',          32, 0, 0, 0, true),
  ('GTCAP',  'GT Capital Holdings, Inc.',                'Holding Firms',     633, 0, 0, 0, true),
  ('JGS',    'JG Summit Holdings, Inc.',                'Holding Firms',      210, 0, 0, 0, true),
  ('LTG',    'LT Group, Inc.',                          'Holding Firms',       12, 0, 0, 0, true),
  ('MPI',    'Metro Pacific Investments Corporation',   'Holding Firms',      604, 0, 0, 0, true),
  ('PGOLD',  'Puregold Price Club, Inc.',               'Consumer',           629, 0, 0, 0, true),
  ('RLC',    'Robinsons Land Corporation',              'Property',           195, 0, 0, 0, true),
  ('WLCON',  'Wilcon Depot, Inc.',                      'Industrial',         665, 0, 0, 0, true),
  ('CNPF',   'Century Pacific Food, Inc.',              'Consumer',           652, 0, 0, 0, true),
  ('DMC',    'DMCI Holdings, Inc.',                     'Holding Firms',      188, 0, 0, 0, true),
  ('EMI',    'Emperador Inc.',                          'Consumer',           632, 0, 0, 0, true),
  ('FGEN',   'First Gen Corporation',                   'Industrial',         600, 0, 0, 0, true),
  ('CEB',    'Cebu Air, Inc.',                          'Industrial',         624, 0, 0, 0, true),
  ('MONDE',  'Monde Nissin Corporation',                'Consumer',           682, 0, 0, 0, true),
  ('ACEN',   'ACEN Corporation',                        'Industrial',         233, 0, 0, 0, true),
  ('BLOOM',  'Bloomberry Resorts Corporation',          'Consumer',            49, 0, 0, 0, true),
  ('COL',    'COL Financial Group, Inc.',               'Financials',         601, 0, 0, 0, true)
on conflict (symbol) do update set
  company_name         = excluded.company_name,
  sector               = excluded.sector,
  cmpy_id              = excluded.cmpy_id,
  is_pse_index_member  = excluded.is_pse_index_member;
