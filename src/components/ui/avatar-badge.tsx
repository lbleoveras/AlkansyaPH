import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { getStockLogoUrl } from '@/constants/stock-logos';

type AvatarBadgeProps = {
  label: string;
  color: string;
  size?: number;
  /** PSE ticker symbol -- when a real logo is available for it, renders that
   * instead of initials (falls back to initials if the image fails to load). */
  symbol?: string;
};

export function AvatarBadge({ label, color, size = 44, symbol }: AvatarBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoUrl = symbol ? getStockLogoUrl(symbol) : undefined;
  const showLogo = logoUrl && !imageFailed;

  const initials = label
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}>
      {showLogo ? (
        <View style={[styles.logoWrap, { width: size, height: size, borderRadius: size / 2 }]}>
          <Image
            source={{ uri: logoUrl }}
            style={{ width: size * 0.62, height: size * 0.62 }}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        </View>
      ) : (
        <Text style={[styles.label, { fontSize: size * 0.36 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
