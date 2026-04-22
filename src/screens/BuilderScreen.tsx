import { useState, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Alert, TextInput, Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Module, Preset } from '../types';
import { loadPresets, savePresets } from '../storage';
import { formatDuration } from '../audio';
import ModuleCard from '../components/ModuleCard';
import ModuleForm from '../components/ModuleForm';

type Props = NativeStackScreenProps<RootStackParamList, 'Builder'>;

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function totalAllocated(modules: Module[]): number {
  return modules.reduce((sum, m) => sum + m.durationSeconds, 0);
}

export default function BuilderScreen({ navigation, route }: Props) {
  const { presetId, isNewSession } = route.params ?? {};

  const [preset, setPreset] = useState<Preset | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [sessionMinutes, setSessionMinutes] = useState('120');
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [isNewModule, setIsNewModule] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    (async () => {
      if (isNewSession) {
        setModules([]);
        setSessionMinutes('120');
        return;
      }
      if (presetId) {
        const all = await loadPresets();
        const found = all.find(p => p.id === presetId) ?? null;
        if (found) {
          setPreset(found);
          setModules([...found.modules]);
          setSessionMinutes(String(Math.round(found.totalSessionSeconds / 60)));
        }
      }
    })();
  }, [presetId, isNewSession]);

  // Header right button
  useLayoutEffect(() => {
    navigation.setOptions({
      title: preset?.name ?? (isNewSession ? 'New Session' : 'Session'),
      headerRight: () => (
        <TouchableOpacity onPress={() => {
          setSaveName(preset?.name ?? '');
          setSaveModalVisible(true);
        }}>
          <Text style={styles.headerSave}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, preset, isNewSession]);

  // Time accounting
  const totalSessionSecs = Math.max(1, parseFloat(sessionMinutes) || 0) * 60;
  const allocatedSecs = totalAllocated(modules);
  const diffSecs = totalSessionSecs - allocatedSecs;
  const isOver  = diffSecs < 0;
  const isExact = diffSecs === 0;
  const fillRatio = Math.min(1, allocatedSecs / totalSessionSecs);

  function timingMessage(): string {
    if (modules.length === 0) return 'Add modules to fill the session.';
    if (isExact) return 'Session is perfectly timed.';
    const dur = formatDuration(Math.abs(diffSecs));
    if (isOver) return `${dur} over — shorten a module or trim the list.`;
    if (Math.abs(diffSecs) <= 120) return `${dur} to spare — nearly there.`;
    return `${dur} unallocated — room to add more modules.`;
  }

  // Module operations
  function openNewModule() {
    setEditingModule(null);
    setIsNewModule(true);
    setFormVisible(true);
  }

  function openEditModule(m: Module) {
    setEditingModule(m);
    setIsNewModule(false);
    setFormVisible(true);
  }

  function handleFormSave(m: Module) {
    setFormVisible(false);
    if (isNewModule) {
      setModules(prev => [...prev, m]);
    } else {
      setModules(prev => prev.map(x => x.id === m.id ? m : x));
    }
  }

  function duplicateModule(m: Module) {
    const dupe: Module = { ...m, id: randomId() };
    setModules(prev => {
      const idx = prev.findIndex(x => x.id === m.id);
      const next = [...prev];
      next.splice(idx + 1, 0, dupe);
      return next;
    });
  }

  function deleteModule(id: string) {
    Alert.alert('Remove module?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => setModules(prev => prev.filter(m => m.id !== id)),
      },
    ]);
  }

  function moveModule(index: number, direction: 'up' | 'down') {
    setModules(prev => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // Save preset
  async function handleSave() {
    const name = saveName.trim();
    if (!name) {
      Alert.alert('Name required', 'Give this session a name.');
      return;
    }
    const all = await loadPresets();
    const now = Date.now();

    if (preset) {
      // Update existing
      const updated = all.map(p => p.id === preset.id
        ? { ...p, name, modules, totalSessionSeconds: totalSessionSecs, updatedAt: now }
        : p
      );
      await savePresets(updated);
    } else {
      // Create new
      const newPreset: Preset = {
        id: randomId(),
        name,
        modules,
        totalSessionSeconds: totalSessionSecs,
        createdAt: now,
        updatedAt: now,
      };
      await savePresets([...all, newPreset]);
    }

    setSaveModalVisible(false);
    setSaveName('');
    navigation.goBack();
  }

  function startSession() {
    if (modules.length === 0) {
      Alert.alert('No modules', 'Add at least one module to start.');
      return;
    }
    navigation.navigate('Player', { modules, totalSessionSeconds: totalSessionSecs });
  }

  return (
    <View style={styles.container}>
      {/* Session length + timing bar */}
      <View style={styles.topBar}>
        <View style={styles.sessionLengthRow}>
          <Text style={styles.sessionLengthLabel}>Session length (min)</Text>
          <TextInput
            style={styles.sessionLengthInput}
            value={sessionMinutes}
            onChangeText={setSessionMinutes}
            keyboardType="number-pad"
          />
        </View>

        {/* Fill bar */}
        <View style={styles.fillTrack}>
          <View style={[
            styles.fillBar,
            { width: `${Math.round(fillRatio * 100)}%` },
            isOver  ? styles.fillOver  :
            isExact ? styles.fillExact :
                      styles.fillUnder,
          ]} />
          {isOver && (
            <View style={styles.fillOverflow} />
          )}
        </View>

        {/* Timing message */}
        <Text style={[
          styles.timingMessage,
          isOver  ? styles.timingOver  :
          isExact ? styles.timingExact :
                    styles.timingUnder,
        ]}>
          {timingMessage()}
        </Text>
      </View>

      {/* Module list */}
      <FlatList
        data={modules}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No modules yet.</Text>
            <Text style={styles.emptySubText}>Tap "Add Module" to build your session.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ModuleCard
            module={item}
            index={index}
            total={modules.length}
            onEdit={() => openEditModule(item)}
            onDuplicate={() => duplicateModule(item)}
            onDelete={() => deleteModule(item.id)}
            onMoveUp={() => moveModule(index, 'up')}
            onMoveDown={() => moveModule(index, 'down')}
          />
        )}
      />

      {/* Footer buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={openNewModule}>
          <Text style={styles.addButtonText}>+ Add Module</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.startButton, modules.length === 0 && styles.startButtonDisabled]}
          onPress={startSession}
          disabled={modules.length === 0}
        >
          <Text style={styles.startButtonText}>▶ Start Session</Text>
        </TouchableOpacity>
      </View>

      {/* Module edit form */}
      <ModuleForm
        module={isNewModule ? null : editingModule}
        visible={formVisible}
        onSave={handleFormSave}
        onCancel={() => setFormVisible(false)}
      />

      {/* Save preset modal */}
      <Modal
        visible={saveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.saveOverlay}>
          <View style={styles.saveBox}>
            <Text style={styles.saveTitle}>Save Session</Text>
            <TextInput
              style={styles.saveInput}
              value={saveName}
              onChangeText={setSaveName}
              placeholder={preset?.name ?? 'Session name'}
              placeholderTextColor="#555"
              autoFocus
            />
            <View style={styles.saveButtons}>
              <TouchableOpacity
                style={styles.saveCancelBtn}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={styles.saveCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveConfirmBtn} onPress={handleSave}>
                <Text style={styles.saveConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  topBar: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sessionLengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sessionLengthLabel: { color: '#aaa', fontSize: 16 },
  sessionLengthInput: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
    textAlign: 'center',
  },
  fillTrack: {
    height: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  fillBar: {
    height: 4,
    borderRadius: 2,
  },
  fillUnder: { backgroundColor: '#c8803c' },
  fillExact: { backgroundColor: '#1a6b3c' },
  fillOver:  { backgroundColor: '#c0392b' },
  fillOverflow: {
    flex: 1,
    height: 4,
    backgroundColor: '#c0392b',
    opacity: 0.3,
  },
  timingMessage: { fontSize: 15, fontWeight: '500' },
  timingOver:  { color: '#e05040' },
  timingExact: { color: '#4a9b6a' },
  timingUnder: { color: '#c8803c' },
  list: { padding: 16, flexGrow: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: '#666', fontSize: 19, marginBottom: 8 },
  emptySubText: { color: '#555', fontSize: 16 },
  footer: {
    padding: 16,
    paddingBottom: 36,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  addButtonText: { color: '#bbb', fontSize: 18 },
  startButton: {
    backgroundColor: '#1a6b3c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  startButtonDisabled: { opacity: 0.35 },
  startButtonText: { color: '#fff', fontSize: 19, fontWeight: '600' },
  headerSave: { color: '#4a9b6a', fontSize: 18, fontWeight: '600', marginRight: 4 },
  saveOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  saveBox: {
    backgroundColor: '#111', borderRadius: 16, padding: 24, width: '100%',
  },
  saveTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  saveInput: {
    backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14,
    color: '#fff', fontSize: 18, marginBottom: 16,
  },
  saveButtons: { flexDirection: 'row', gap: 10 },
  saveCancelBtn: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  saveCancelText: { color: '#777', fontSize: 18 },
  saveConfirmBtn: {
    flex: 1, backgroundColor: '#1a6b3c', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  saveConfirmText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
