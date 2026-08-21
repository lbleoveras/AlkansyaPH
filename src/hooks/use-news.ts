import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { NewsArticle } from '@/types';

type NewsArticleRow = {
  id: string;
  headline: string;
  source: string;
  summary: string | null;
  url: string;
  published_at: string;
  related_symbol: string | null;
};

function mapRowToArticle(row: NewsArticleRow): NewsArticle {
  return {
    id: row.id,
    headline: row.headline,
    source: row.source,
    publishedAt: row.published_at,
    imageUrl: '',
    summary: row.summary ?? '',
    url: row.url,
    relatedSymbol: row.related_symbol ?? undefined,
  };
}

async function fetchNews(): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, headline, source, summary, url, published_at, related_symbol')
    .order('published_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(mapRowToArticle);
}

export function useNews() {
  const query = useQuery({
    queryKey: ['news'],
    queryFn: fetchNews,
    staleTime: 10 * 60_000,
  });

  return {
    articles: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
