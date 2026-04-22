import AsyncStorage from '@react-native-async-storage/async-storage';

const VOLUME_KEY = 'app_volume';
const DEFAULT_VOLUME = 1.0;

export async function loadVolume(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(VOLUME_KEY);
    if (raw === null) return DEFAULT_VOLUME;
    const v = parseFloat(raw);
    return isNaN(v) ? DEFAULT_VOLUME : Math.min(1, Math.max(0, v));
  } catch {
    return DEFAULT_VOLUME;
  }
}

export async function saveVolume(volume: number): Promise<void> {
  try {
    await AsyncStorage.setItem(VOLUME_KEY, String(volume));
  } catch {}
}
