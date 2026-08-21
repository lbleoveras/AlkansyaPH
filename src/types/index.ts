export type Stock = {
  symbol: string;
  companyName: string;
  sector: string;
  price: number;
  changeAmount: number;
  changePercent: number;
  color: string;
  floatMillion: number;
  marketCapBillion: number;
  indexWeightPercent: number;
  idxPointChange: number;
};

export type Holding = {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  createdAt: string;
};

export type PortfolioPoint = {
  date: string;
  value: number;
};

export type PerformanceRange = '1W' | '1M' | '3M' | '1Y';

export type NewsArticle = {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  imageUrl: string;
  summary: string;
  url: string;
  relatedSymbol?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};
