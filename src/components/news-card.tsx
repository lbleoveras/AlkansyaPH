import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { NewsArticle } from '@/types';
import { formatRelativeDate } from '@/utils/format';

export function NewsCard({ article }: { article: NewsArticle }) {
  const theme = useTheme();

  const openArticle = () => {
    if (Platform.OS === 'web') {
      window.open(article.url, '_blank', 'noopener,noreferrer');
      return;
    }
    WebBrowser.openBrowserAsync(article.url);
  };

  return (
    <Pressable
      onPress={openArticle}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={[styles.thumbnail, { backgroundColor: theme.tintSoft }]}>
        <Ionicons name="newspaper-outline" size={22} color={theme.tint} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.headline, { color: theme.text }]} numberOfLines={2}>
          {article.headline}
        </Text>
        <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={2}>
          {article.summary}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.source, { color: theme.text }]}>{article.source}</Text>
          <Text style={[styles.dot, { color: theme.textSecondary }]}>·</Text>
          <Text style={[styles.time, { color: theme.textSecondary }]}>
            {formatRelativeDate(article.publishedAt)}
          </Text>
          <Ionicons
            name="open-outline"
            size={13}
            color={theme.textSecondary}
            style={styles.openIcon}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: Radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  headline: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 19,
  },
  summary: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  source: {
    fontSize: 12,
    fontWeight: '700',
  },
  dot: {
    fontSize: 12,
  },
  time: {
    fontSize: 12,
  },
  openIcon: {
    marginLeft: 'auto',
  },
});
