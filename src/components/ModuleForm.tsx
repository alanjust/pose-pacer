import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, ScrollView, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Module, ModuleType, SoundChoice } from '../types';
import DurationTumbler from './DurationTumbler';

interface Props {
  module: Module | null;  // null = new module
  visible: boolean;
  onSave: (module: Module) => void;
  onCancel: () => void;
}

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SOUND_OPTIONS: { value: SoundChoice; label: string }[] = [
  { value: 'single', label: 'Single ding' },
  { value: 'double', label: 'Double ding' },
];

export default function ModuleForm({ module, visible, onSave, onCancel }: Props) {
  const isNew = module === null;

  const [type,         setType]         = useState<ModuleType>(module?.type ?? 'pose');
  const [durationSecs, setDurationSecs] = useState(module?.durationSeconds ?? 300);
  const [label,        setLabel]        = useState(module?.label ?? '');
  const [startSound,   setStartSound]   = useState<SoundChoice>(module?.startSound ?? 'single');
  const [endSound,     setEndSound]     = useState<SoundChoice>(module?.endSound ?? 'double');
  const [leadIn,       setLeadIn]       = useState(module?.leadIn ?? false);
  const [warningInput, setWarningInput] = useState(
    module?.warningThresholdSeconds ? String(Math.round(module.warningThresholdSeconds / 60)) : ''
  );

  // Reset all fields when the modal opens with a (possibly different) module
  function reset(m: Module | null) {
    setType(m?.type ?? 'pose');
    setDurationSecs(m?.durationSeconds ?? 300);
    setLabel(m?.label ?? '');
    setStartSound(m?.startSound ?? 'single');
    setEndSound(m?.endSound ?? 'double');
    setLeadIn(m?.leadIn ?? false);
    setWarningInput(m?.warningThresholdSeconds ? String(Math.round(m.warningThresholdSeconds / 60)) : '');
  }

  function handleSave() {
    const warningThresholdSeconds = warningInput.trim()
      ? Math.max(0, parseInt(warningInput, 10)) * 60
      : undefined;

    onSave({
      id: module?.id ?? randomId(),
      type,
      durationSeconds: Math.max(5, durationSecs),
      label: label.trim() || undefined,
      startSound,
      endSound,
      leadIn,
      warningThresholdSeconds,
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
      onShow={() => reset(module)}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.headerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isNew ? 'New Module' : 'Edit Module'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.headerSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Type toggle */}
          <Text style={styles.sectionLabel}>TYPE</Text>
          <View style={styles.toggle}>
            {(['pose', 'break'] as ModuleType[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleOption, type === t && styles.toggleActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
                  {t === 'pose' ? 'Pose' : 'Break'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration tumbler */}
          <Text style={styles.sectionLabel}>DURATION</Text>
          <DurationTumbler
            key={module?.id ?? 'new'}
            value={durationSecs}
            onChange={setDurationSecs}
          />

          {/* Label */}
          <Text style={styles.sectionLabel}>LABEL (optional)</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Gesture warm-up"
            placeholderTextColor="#555"
          />

          {/* Start sound */}
          <Text style={styles.sectionLabel}>START SOUND</Text>
          <View style={styles.toggle}>
            {SOUND_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[styles.toggleOption, startSound === o.value && styles.toggleActive]}
                onPress={() => setStartSound(o.value)}
              >
                <Text style={[styles.toggleText, startSound === o.value && styles.toggleTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* End sound */}
          <Text style={styles.sectionLabel}>END SOUND</Text>
          <View style={styles.toggle}>
            {SOUND_OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[styles.toggleOption, endSound === o.value && styles.toggleActive]}
                onPress={() => setEndSound(o.value)}
              >
                <Text style={[styles.toggleText, endSound === o.value && styles.toggleTextActive]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lead-in */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>10-second lead-in</Text>
              <Text style={styles.switchSub}>Countdown before this module starts</Text>
            </View>
            <Switch
              value={leadIn}
              onValueChange={setLeadIn}
              trackColor={{ false: '#222', true: '#1a6b3c' }}
              thumbColor="#fff"
            />
          </View>

          {/* Warning threshold */}
          <Text style={styles.sectionLabel}>VERBAL WARNING (minutes before end, optional)</Text>
          <TextInput
            style={styles.input}
            value={warningInput}
            onChangeText={setWarningInput}
            keyboardType="number-pad"
            placeholder="e.g. 5"
            placeholderTextColor="#555"
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerCancel: { color: '#777', fontSize: 16 },
  headerTitle:  { color: '#fff', fontSize: 17, fontWeight: '600' },
  headerSave:   { color: '#4a9b6a', fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1, padding: 20 },
  sectionLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive:     { backgroundColor: '#1a3a6b' },
  toggleText:       { color: '#777', fontSize: 15 },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
  },
  switchLabel: { color: '#fff', fontSize: 16 },
  switchSub:   { color: '#666', fontSize: 13, marginTop: 2 },
});
