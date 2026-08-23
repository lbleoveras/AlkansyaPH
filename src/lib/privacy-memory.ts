import AsyncStorage from '@react-native-async-storage/async-storage';

const HIDE_NUMBERS_KEY = 'alkansyaph.hideNumbers';

export async function getHideNumbers(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(HIDE_NUMBERS_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setHideNumbers(hidden: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(HIDE_NUMBERS_KEY, hidden ? '1' : '0');
  } catch {
    // best-effort -- worst case the preference doesn't stick
  }
}
