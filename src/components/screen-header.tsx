import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AvatarBadge } from '@/components/ui/avatar-badge';
import { Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const NOTIFICATIONS = [
  { id: 'note1', text: 'BDO is up 1.26% today', time: '2h ago' },
  { id: 'note2', text: 'PSE market closes in 30 minutes', time: '4h ago' },
  { id: 'note3', text: 'Your portfolio is up ₱1,240 this week', time: '1d ago' },
];

export function ScreenHeader({ title }: { title: string }) {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.push('/(tabs)/settings')}
        hitSlop={8}
        accessibilityLabel="Open profile">
        <AvatarBadge label={user?.name ?? 'You'} color={theme.tint} size={38} />
      </Pressable>

      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      <Pressable
        onPress={() => setShowNotifications(true)}
        hitSlop={8}
        accessibilityLabel="Notifications"
        style={[styles.bellButton, { backgroundColor: theme.backgroundElement }]}>
        <Ionicons name="notifications-outline" size={20} color={theme.text} />
        <View style={[styles.dot, { backgroundColor: theme.negative, borderColor: theme.card }]} />
      </Pressable>

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowNotifications(false)}>
          <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.panelTitle, { color: theme.text }]}>Notifications</Text>
            {NOTIFICATIONS.map((note) => (
              <View key={note.id} style={[styles.noteRow, { borderTopColor: theme.border }]}>
                <View style={[styles.noteDot, { backgroundColor: theme.tint }]} />
                <View style={styles.noteBody}>
                  <Text style={[styles.noteText, { color: theme.text }]}>{note.text}</Text>
                  <Text style={[styles.noteTime, { color: theme.textSecondary }]}>{note.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: Spacing.three,
  },
  panel: {
    width: 280,
    borderRadius: Radii.medium,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
    boxShadow: '0px 8px 20px rgba(0,0,0,0.15)',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  noteRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  noteBody: {
    flex: 1,
    gap: 2,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noteTime: {
    fontSize: 11,
  },
});
