import { Stock } from '@/types';

const badgeColors = [
  '#2E7D32',
  '#1565C0',
  '#C2410C',
  '#6D28D9',
  '#B91C1C',
  '#0F766E',
  '#A16207',
  '#BE185D',
  '#4338CA',
  '#15803D',
];

type RawStock = Omit<Stock, 'color' | 'idxPointChange'>;

function withComputedFields(stock: RawStock, index: number): Stock {
  const idxPointChange = Math.round(((stock.indexWeightPercent * stock.changePercent) / 15) * 100) / 100;
  return { ...stock, color: badgeColors[index % badgeColors.length], idxPointChange };
}

const rawStocks: RawStock[] = [
  { symbol: 'SM', companyName: 'SM Investments Corporation', sector: 'Holding Firms', price: 912.0, changeAmount: 8.5, changePercent: 0.94, floatMillion: 700, marketCapBillion: 900, indexWeightPercent: 9.5 },
  { symbol: 'SMPH', companyName: 'SM Prime Holdings, Inc.', sector: 'Property', price: 27.85, changeAmount: -0.35, changePercent: -1.24, floatMillion: 6000, marketCapBillion: 480, indexWeightPercent: 6.5 },
  { symbol: 'BDO', companyName: 'BDO Unibank, Inc.', sector: 'Financials', price: 152.4, changeAmount: 1.9, changePercent: 1.26, floatMillion: 3600, marketCapBillion: 550, indexWeightPercent: 8.0 },
  { symbol: 'BPI', companyName: 'Bank of the Philippine Islands', sector: 'Financials', price: 138.7, changeAmount: -1.1, changePercent: -0.79, floatMillion: 3300, marketCapBillion: 460, indexWeightPercent: 6.0 },
  { symbol: 'ALI', companyName: 'Ayala Land, Inc.', sector: 'Property', price: 28.0, changeAmount: 0.45, changePercent: 1.63, floatMillion: 13000, marketCapBillion: 380, indexWeightPercent: 5.5 },
  { symbol: 'AC', companyName: 'Ayala Corporation', sector: 'Holding Firms', price: 621.0, changeAmount: 12.0, changePercent: 1.97, floatMillion: 500, marketCapBillion: 310, indexWeightPercent: 4.5 },
  { symbol: 'AEV', companyName: 'Aboitiz Equity Ventures, Inc.', sector: 'Holding Firms', price: 44.6, changeAmount: -0.2, changePercent: -0.45, floatMillion: 2100, marketCapBillion: 95, indexWeightPercent: 1.8 },
  { symbol: 'AP', companyName: 'Aboitiz Power Corporation', sector: 'Industrial', price: 36.05, changeAmount: 0.3, changePercent: 0.84, floatMillion: 2300, marketCapBillion: 83, indexWeightPercent: 1.5 },
  { symbol: 'JFC', companyName: 'Jollibee Foods Corporation', sector: 'Consumer', price: 258.0, changeAmount: 3.4, changePercent: 1.34, floatMillion: 275, marketCapBillion: 71, indexWeightPercent: 2.8 },
  { symbol: 'URC', companyName: 'Universal Robina Corporation', sector: 'Consumer', price: 101.9, changeAmount: -0.9, changePercent: -0.88, floatMillion: 550, marketCapBillion: 56, indexWeightPercent: 1.6 },
  { symbol: 'TEL', companyName: 'PLDT Inc.', sector: 'Telecommunications', price: 1456.0, changeAmount: 14.0, changePercent: 0.97, floatMillion: 93, marketCapBillion: 135, indexWeightPercent: 4.2 },
  { symbol: 'GLO', companyName: 'Globe Telecom, Inc.', sector: 'Telecommunications', price: 1789.0, changeAmount: -21.0, changePercent: -1.16, floatMillion: 43, marketCapBillion: 77, indexWeightPercent: 2.5 },
  { symbol: 'ICT', companyName: 'International Container Terminal Services, Inc.', sector: 'Industrial', price: 315.0, changeAmount: 4.6, changePercent: 1.48, floatMillion: 620, marketCapBillion: 195, indexWeightPercent: 3.8 },
  { symbol: 'MER', companyName: 'Manila Electric Company', sector: 'Industrial', price: 412.0, changeAmount: 2.0, changePercent: 0.49, floatMillion: 400, marketCapBillion: 170, indexWeightPercent: 3.2 },
  { symbol: 'MBT', companyName: 'Metropolitan Bank & Trust Company', sector: 'Financials', price: 76.5, changeAmount: 0.6, changePercent: 0.79, floatMillion: 4400, marketCapBillion: 337, indexWeightPercent: 3.0 },
  { symbol: 'SECB', companyName: 'Security Bank Corporation', sector: 'Financials', price: 112.3, changeAmount: -0.7, changePercent: -0.62, floatMillion: 590, marketCapBillion: 66, indexWeightPercent: 1.1 },
  { symbol: 'GTCAP', companyName: 'GT Capital Holdings, Inc.', sector: 'Holding Firms', price: 745.0, changeAmount: 9.0, changePercent: 1.22, floatMillion: 175, marketCapBillion: 130, indexWeightPercent: 2.0 },
  { symbol: 'JGS', companyName: 'JG Summit Holdings, Inc.', sector: 'Holding Firms', price: 32.4, changeAmount: -0.15, changePercent: -0.46, floatMillion: 3900, marketCapBillion: 126, indexWeightPercent: 1.9 },
  { symbol: 'LTG', companyName: 'LT Group, Inc.', sector: 'Holding Firms', price: 12.36, changeAmount: 0.1, changePercent: 0.82, floatMillion: 6900, marketCapBillion: 85, indexWeightPercent: 0.9 },
  { symbol: 'MPI', companyName: 'Metro Pacific Investments Corporation', sector: 'Holding Firms', price: 4.55, changeAmount: 0.02, changePercent: 0.44, floatMillion: 24000, marketCapBillion: 109, indexWeightPercent: 1.0 },
  { symbol: 'PGOLD', companyName: 'Puregold Price Club, Inc.', sector: 'Consumer', price: 39.9, changeAmount: 0.55, changePercent: 1.4, floatMillion: 2200, marketCapBillion: 88, indexWeightPercent: 1.2 },
  { symbol: 'RLC', companyName: 'Robinsons Land Corporation', sector: 'Property', price: 16.02, changeAmount: -0.08, changePercent: -0.5, floatMillion: 4600, marketCapBillion: 74, indexWeightPercent: 0.7 },
  { symbol: 'WLCON', companyName: 'Wilcon Depot, Inc.', sector: 'Industrial', price: 16.9, changeAmount: 0.24, changePercent: 1.44, floatMillion: 2600, marketCapBillion: 44, indexWeightPercent: 0.6 },
  { symbol: 'CNPF', companyName: 'Century Pacific Food, Inc.', sector: 'Consumer', price: 29.3, changeAmount: 0.1, changePercent: 0.34, floatMillion: 2340, marketCapBillion: 68, indexWeightPercent: 0.8 },
  { symbol: 'DMC', companyName: 'DMCI Holdings, Inc.', sector: 'Holding Firms', price: 13.42, changeAmount: -0.06, changePercent: -0.44, floatMillion: 4400, marketCapBillion: 59, indexWeightPercent: 0.7 },
  { symbol: 'EMI', companyName: 'Emperador Inc.', sector: 'Consumer', price: 18.7, changeAmount: 0.12, changePercent: 0.65, floatMillion: 4800, marketCapBillion: 90, indexWeightPercent: 0.9 },
  { symbol: 'FGEN', companyName: 'First Gen Corporation', sector: 'Industrial', price: 17.24, changeAmount: -0.18, changePercent: -1.03, floatMillion: 2190, marketCapBillion: 38, indexWeightPercent: 0.5 },
  { symbol: 'CEB', companyName: 'Cebu Air, Inc.', sector: 'Industrial', price: 34.5, changeAmount: 0.85, changePercent: 2.53, floatMillion: 273, marketCapBillion: 27, indexWeightPercent: 0.4 },
];

export const stocks: Stock[] = rawStocks.map(withComputedFields);

export function getStockBySymbol(symbol: string): Stock | undefined {
  return stocks.find((stock) => stock.symbol === symbol);
}
