import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Module } from '../types';
import { formatDuration } from '../audio';

interface Props {
  module: Module;
  index: number;
  total: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function ModuleCard({
  module, index, total, onEdit, onDuplicate, onDelete, onMoveUp, onMoveDown,
}: Props) {
  const isPose = module.type === 'pose';
  const label = module.label || (isPose ? 'Pose' : 'Break');

  return (
    <View style={styles.card}>
      {/* Type badge + label + duration */}
      <TouchableOpacity style={styles.main} onPress={onEdit}>
        <View style={[styles.badge, isPose ? styles.badgePose : styles.badgeBreak]}>
          <Text style={styles.badgeText}>{isPose ? 'POSE' : 'BREAK'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.duration}>{formatDuration(module.durationSeconds)}</Text>
        </View>
        <Text style={styles.editHint}>Edit ›</Text>
      </TouchableOpacity>

      {/* Actions row */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onMoveUp} disabled={index === 0}>
          <Text style={[styles.actionText, index === 0 && styles.actionDisabled]}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onMoveDown} disabled={index === total - 1}>
          <Text style={[styles.actionText, index === total - 1 && styles.actionDisabled]}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onDuplicate}>
          <Text style={styles.actionText}>⧉</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
          <Text style={[styles.actionText, styles.actionDelete]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePose: { backgroundColor: '#1a3a6b' },
  badgeBreak: { backgroundColor: '#2a1a00' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  info: { flex: 1 },
  label: { color: '#fff', fontSize: 16, fontWeight: '500' },
  duration: { color: '#4a9b6a', fontSize: 13, marginTop: 2 },
  editHint: { color: '#4a9b6a', fontSize: 14 },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: { color: '#2979FF', fontSize: 22 },
  actionDisabled: { color: '#222' },
  actionDelete: { color: '#cc3333' },
});
