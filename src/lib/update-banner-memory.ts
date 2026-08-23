import AsyncStorage from '@react-native-async-storage/async-storage';

const DISMISSED_VERSION_KEY = 'alkansyaph.dismissedUpdateVersion';

export async function getDismissedUpdateVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(DISMISSED_VERSION_KEY);
  } catch {
    return null;
  }
}

export async function setDismissedUpdateVersion(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_VERSION_KEY, version);
  } catch {
    // best-effort -- worst case the banner reappears next open
  }
}
