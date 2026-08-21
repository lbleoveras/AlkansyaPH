import { StyleSheet, Text, View } from 'react-native';

import { NewsCard } from '@/components/news-card';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useNews } from '@/hooks/use-news';
import { useTheme } from '@/hooks/use-theme';

export default function NewsScreen() {
  const theme = useTheme();
  const { articles, isLoading } = useNews();

  return (
    <ScreenContainer>
      <ScreenHeader title="News" />

      {articles.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          {isLoading ? 'Loading news…' : 'No news available right now.'}
        </Text>
      ) : (
        <View style={styles.list}>
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
});
