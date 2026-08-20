import { StyleSheet, View } from 'react-native';

import { NewsCard } from '@/components/news-card';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { newsArticles } from '@/data/news';

export default function NewsScreen() {
  return (
    <ScreenContainer>
      <ScreenHeader title="News" />

      <View style={styles.list}>
        {newsArticles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
});
