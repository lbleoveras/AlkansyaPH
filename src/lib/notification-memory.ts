import AsyncStorage from '@react-native-async-storage/async-storage';

function key(userId: string): string {
  return `alkansyaph.seenNotifications.${userId}`;
}

export async function getSeenNotificationsSignature(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key(userId));
  } catch {
    return null;
  }
}

export async function markNotificationsSeen(userId: string, signature: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), signature);
  } catch {
    // best-effort convenience only -- fine to lose silently
  }
}
