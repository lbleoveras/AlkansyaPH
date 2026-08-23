import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_VERSION_KEY = 'alkansyaph.lastSeenAppVersion';

export async function getLastSeenAppVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SEEN_VERSION_KEY);
  } catch {
    return null;
  }
}

export async function setLastSeenAppVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SEEN_VERSION_KEY, version);
  } catch {
    // best-effort -- worst case "what's new" shows again next open
  }
}
