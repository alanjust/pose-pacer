import { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Modal, PanResponder, StyleSheet,
  Switch, Text, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAppVolume, setAppVolume,
  getDingEnabled, setDingEnabled as setAudioDing,
  getVoiceEnabled, setVoiceEnabled as setAudioVoice,
} from '../audio';
import { saveDingEnabled, saveVoiceEnabled, saveVolume } from '../settings';
import { savePresets } from '../storage';
import { STARTER_PRESETS } from '../starterPreset';

const DRAWER_WIDTH = 300;
const THUMB        = 26;

function clamp(v: number) { return Math.min(1, Math.max(0, v)); }

interface Props {
  visible: boolean;
  onClose: () => void;
  onHowItWorks: () => void;
}

export default function DrawerMenu({ visible, onClose, onHowItWorks }: Props) {
  // Drawer slides in from the right — starts off-screen to the right
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  const [volume, setVolume]           = useState(getAppVolume());
  const [voiceOn, setVoiceOn]         = useState(getVoiceEnabled());
  const [dingOn, setDingOn]           = useState(getDingEnabled());
  const [trackWidth, setTrackWidth]   = useState(0);
  const [volExpanded, setVolExpanded] = useState(false);

  const volumeRef   = useRef(volume);
  const trackWRef   = useRef(trackWidth);
  const startXRef   = useRef(0);
  const startValRef = useRef(0);

  useEffect(() => { volumeRef.current = volume; },    [volume]);
  useEffect(() => { trackWRef.current = trackWidth; }, [trackWidth]);

  // Animate in / out when visibility changes
  useEffect(() => {
    if (visible) {
      // Refresh in-memory values each time the drawer opens
      setVolume(getAppVolume());
      setVoiceOn(getVoiceEnabled());
      setDingOn(getDingEnabled());
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Volume slider (same PanResponder pattern as SettingsScreen)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: (e) => {
        if (trackWRef.current <= 0) return;
        const x = e.nativeEvent.locationX;
        const v = clamp(x / trackWRef.current);
        startXRef.current   = x;
        startValRef.current = v;
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

  const pct      = Math.round(volume * 100);
  const thumbLeft = trackWidth > 0 ? volume * trackWidth - THUMB / 2 : 0;

  function handleVoiceToggle(val: boolean) {
    setVoiceOn(val);
    setAudioVoice(val);
    saveVoiceEnabled(val);
  }

  function handleDingToggle(val: boolean) {
    setDingOn(val);
    setAudioDing(val);
    saveDingEnabled(val);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* ── Backdrop — tap to close ── */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* ── Drawer panel (right side) ── */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Pose Pacer</Text>
          </View>

          {/* How it works */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => { onClose(); onHowItWorks(); }}
          >
            <Text style={styles.rowLabel}>How it works</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Volume — tap row to expand slider */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setVolExpanded(e => !e)}
          >
            <Text style={styles.rowLabel}>Volume</Text>
            <Text style={styles.rowValue}>{pct}%</Text>
          </TouchableOpacity>

          {volExpanded && (
            <View
              style={styles.sliderOuter}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              {...panResponder.panHandlers}
            >
              <View style={styles.rail} />
              <View style={[styles.fill, { width: `${pct}%` }]} />
              {trackWidth > 0 && (
                <View style={[styles.thumb, { left: thumbLeft }]} />
              )}
            </View>
          )}
          <View style={styles.divider} />

          {/* Voice toggle */}
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Voice</Text>
              <Text style={styles.rowSub}>Pose announcements</Text>
            </View>
            <Switch
              value={voiceOn}
              onValueChange={handleVoiceToggle}
              trackColor={{ false: '#333', true: '#1a6b3c' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />

          {/* Ding toggle */}
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Ding</Text>
              <Text style={styles.rowSub}>Start &amp; end chimes</Text>
            </View>
            <Switch
              value={dingOn}
              onValueChange={handleDingToggle}
              trackColor={{ false: '#333', true: '#1a6b3c' }}
              thumbColor="#fff"
            />
          </View>

          {/* Developer section */}
          <View style={styles.devDivider} />

          {/* Reset presets to defaults */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              Alert.alert(
                'Reset presets to defaults?',
                'Your current sessions will be replaced with the three starter presets. This can\'t be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset', style: 'destructive',
                    onPress: async () => {
                      await savePresets(STARTER_PRESETS);
                      onClose();
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.devLabel}>Reset presets to defaults</Text>
          </TouchableOpacity>
          <View style={styles.devItemDivider} />

          {/* Reset onboarding */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              Alert.alert(
                'Reset onboarding?',
                'The welcome flow will run again on next cold launch.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset', style: 'destructive',
                    onPress: async () => {
                      await AsyncStorage.removeItem('hasOnboarded');
                      onClose();
                      Alert.alert('Done', 'Kill and reopen the app to see onboarding.');
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.devLabelMuted}>Reset onboarding</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#111',
    paddingTop: 64,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#c8803c',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 17,
  },
  rowSub: {
    color: '#555',
    fontSize: 13,
    marginTop: 2,
  },
  rowValue: {
    color: '#c8803c',
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    color: '#555',
    fontSize: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
  },
  sliderOuter: {
    height: 44,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 4,
  },
  rail: {
    position: 'absolute',
    left: 0, right: 0,
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  devDivider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginTop: 24,
  },
  devItemDivider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
  },
  devLabel: {
    color: '#e05c5c',
    fontSize: 15,
  },
  devLabelMuted: {
    color: 'rgba(224, 92, 92, 0.5)',
    fontSize: 15,
  },
});
