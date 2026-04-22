import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getAppVolume, setAppVolume } from '../audio';
import { saveVolume } from '../settings';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const THUMB = 26;

function clamp(v: number) {
  return Math.min(1, Math.max(0, v));
}

export default function SettingsScreen({ navigation }: Props) {
  function handleResetOnboarding() {
    Alert.alert(
      'Reset onboarding?',
      'The app will restart the welcome flow next time it launches.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('hasOnboarded');
            Alert.alert('Done', 'Kill and reopen the app to see onboarding.');
          },
        },
      ]
    );
  }
  const [volume, setVolume] = useState<number>(getAppVolume());
  const [trackWidth, setTrackWidth] = useState(0);

  // Refs so PanResponder callbacks always read current values
  const volumeRef    = useRef(volume);
  const trackWRef    = useRef(trackWidth);
  const startXRef    = useRef(0);
  const startValRef  = useRef(0);

  useEffect(() => { volumeRef.current = volume; },    [volume]);
  useEffect(() => { trackWRef.current = trackWidth; }, [trackWidth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: (e) => {
        if (trackWRef.current <= 0) return;
        // Snap to wherever user touched
        const x = e.nativeEvent.locationX;
        const v = clamp(x / trackWRef.current);
        startXRef.current   = x;
        startValRef.current = v;  // future move deltas are relative to this
        volumeRef.current   = v;
        setVolume(v);
        setAppVolume(v);
      },

      onPanResponderMove: (_, gs) => {
        if (trackWRef.current <= 0) return;
        const v = clamp(startValRef.current + gs.dx / trackWRef.current);
        volumeRef.current = v;
        setVolume(v);
        setAppVolume(v);
      },

      onPanResponderRelease: (_, gs) => {
        if (trackWRef.current <= 0) return;
        const v = clamp(startValRef.current + gs.dx / trackWRef.current);
        saveVolume(v);
      },
    })
  ).current;

  const pct = Math.round(volume * 100);
  // Thumb center travels across the full track width; clamp so it never overflows
  const thumbLeft = trackWidth > 0 ? volume * trackWidth - THUMB / 2 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Audio</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Volume</Text>
          <Text style={styles.value}>{pct}%</Text>
        </View>

        {/* Slider track */}
        <View
          style={styles.trackOuter}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
        >
          {/* Background rail */}
          <View style={styles.rail} />
          {/* Filled portion */}
          <View style={[styles.fill, { width: `${pct}%` }]} />
          {/* Thumb — only render once we know the track width */}
          {trackWidth > 0 && (
            <View style={[styles.thumb, { left: thumbLeft }]} />
          )}
        </View>

        <Text style={styles.hint}>
          Controls chimes and voice announcements. Saved between sessions.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Developer</Text>
        <TouchableOpacity style={styles.devButton} onPress={handleResetOnboarding}>
          <Text style={styles.devButtonText}>Reset onboarding</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Shows the welcome flow again on next cold launch.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 20,
    marginTop: 8,
  },
  sectionHeader: {
    color: '#c8803c',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#fff',
    fontSize: 16,
  },
  value: {
    color: '#c8803c',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 44,
    textAlign: 'right',
  },
  trackOuter: {
    height: 44,
    justifyContent: 'center',
    marginBottom: 12,
  },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 4,
    backgroundColor: '#c8803c',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#c8803c',
    top: (44 - THUMB) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  hint: {
    color: '#555',
    fontSize: 13,
    lineHeight: 19,
  },
  devButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  devButtonText: {
    color: '#e05c5c',
    fontSize: 16,
  },
});
