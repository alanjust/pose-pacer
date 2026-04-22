import AsyncStorage from '@react-native-async-storage/async-storage';
import { Preset } from './types';

const PRESETS_KEY = 'presets';
const ONBOARDED_KEY = 'hasOnboarded';

export async function loadPresets(): Promise<Preset[]> {
  try {
    const raw = await AsyncStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Preset[];
  } catch {
    return [];
  }
}

export async function savePresets(presets: Preset[]): Promise<void> {
  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export async function hasOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDED_KEY);
  return val === 'true';
}

export async function markOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}
