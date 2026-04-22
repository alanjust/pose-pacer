import { useEffect, useLayoutEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, ImageBackground,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Preset } from '../types';
import { loadPresets, savePresets } from '../storage';
import { STARTER_PRESETS } from '../starterPreset';
import { formatDuration } from '../audio';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>⚙︎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Help')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>?</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    (async () => {
      let stored = await loadPresets();
      if (stored.length === 0) {
        stored = STARTER_PRESETS;
        await savePresets(stored);
      }
      setPresets(stored);
    })();
  }, []);

  // Refresh list when returning from Builder
  useEffect(() => {
    const unsub = navigation.addListener('focus', async () => {
      const stored = await loadPresets();
      setPresets(stored);
    });
    return unsub;
  }, [navigation]);

  function deletePreset(id: string) {
    Alert.alert('Delete preset?', 'This can\'t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = presets.filter(p => p.id !== id);
          setPresets(updated);
          await savePresets(updated);
        },
      },
    ]);
  }

  function moduleCountLabel(p: Preset): string {
    const count = p.modules.length;
    const dur = formatDuration(p.totalSessionSeconds);
    return `${count} module${count !== 1 ? 's' : ''} · ${dur}`;
  }

  return (
    <ImageBackground
      source={require('../../assets/figure-sketch.png')}
      style={styles.container}
      imageStyle={styles.bgImage}
    >
      <View style={styles.overlay} />
      <FlatList
        data={presets}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No sessions yet. Create one below.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Builder', { presetId: item.id })}
            onLongPress={() => deletePreset(item.id)}
          >
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>{moduleCountLabel(item)}</Text>
            </View>
            <Text style={styles.cardChevron}>›</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate('Builder', { isNewSession: true })}
        >
          <Text style={styles.newButtonText}>+ New Session</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6b563e' },
  bgImage: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  list: { padding: 16, gap: 10 },
  empty: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 17 },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMain: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 19, fontWeight: '600', marginBottom: 4 },
  cardSub: { color: '#777', fontSize: 15 },
  cardChevron: { color: '#555', fontSize: 26, marginLeft: 8 },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  newButton: {
    backgroundColor: '#1a6b3c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  newButtonText: { color: '#fff', fontSize: 19, fontWeight: '600' },
  headerButtons: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  headerBtn: {},
  headerBtnText: { color: '#aaa', fontSize: 22, fontWeight: '400' },
});
