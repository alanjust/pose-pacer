import { useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// ── Constants ──────────────────────────────────────────────────────────────────
const ITEM_H  = 44;                           // height of each row
const VISIBLE = 5;                            // rows visible at once
const PAD     = ITEM_H * Math.floor(VISIBLE / 2);  // 88 — padding so ends can center
const HEIGHT  = ITEM_H * VISIBLE;            // 220 — total picker height

const HOURS   = Array.from({ length: 6  }, (_, i) => i);   // 0–5
const MINUTES = Array.from({ length: 60 }, (_, i) => i);   // 0–59
const SECONDS = Array.from({ length: 60 }, (_, i) => i);   // 0–59

// ── Single scroll column ───────────────────────────────────────────────────────

interface ColProps {
  items:    number[];
  selected: number;
  onSelect: (v: number) => void;
  label:    string;
}

function Column({ items, selected, onSelect, label }: ColProps) {
  const ref = useRef<ScrollView>(null);

  // Scroll to initial position once the scroll view has laid out
  const handleLayout = useCallback(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0) {
      ref.current?.scrollTo({ y: idx * ITEM_H, animated: false });
    }
  }, [items, selected]);

  const handleScrollEnd = useCallback((e: any) => {
    const y   = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));
    onSelect(items[idx]);
  }, [items, onSelect]);

  return (
    <View style={col.wrapper}>
      <ScrollView
        ref={ref}
        style={{ height: HEIGHT }}
        contentContainerStyle={{ paddingVertical: PAD }}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onLayout={handleLayout}
        scrollEventThrottle={16}
        bounces={false}
      >
        {items.map(n => (
          <View key={n} style={col.item}>
            <Text style={col.text}>{String(n).padStart(2, '0')}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Overlay: dims items above and below the selection */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <View style={col.topFade} />
        <View style={col.selector} />
        <View style={col.bottomFade} />
      </View>

      <Text style={col.label}>{label}</Text>
    </View>
  );
}

// ── Public component ───────────────────────────────────────────────────────────

interface Props {
  value:    number;   // total seconds
  onChange: (seconds: number) => void;
}

export default function DurationTumbler({ value, onChange }: Props) {
  const [h, setH] = useState(Math.floor(value / 3600));
  const [m, setM] = useState(Math.floor((value % 3600) / 60));
  const [s, setS] = useState(value % 60);

  // Refs keep current values accessible inside callbacks without stale closures
  const hRef = useRef(h);
  const mRef = useRef(m);
  const sRef = useRef(s);

  const updateH = useCallback((v: number) => {
    hRef.current = v; setH(v);
    onChange(v * 3600 + mRef.current * 60 + sRef.current);
  }, [onChange]);

  const updateM = useCallback((v: number) => {
    mRef.current = v; setM(v);
    onChange(hRef.current * 3600 + v * 60 + sRef.current);
  }, [onChange]);

  const updateS = useCallback((v: number) => {
    sRef.current = v; setS(v);
    onChange(hRef.current * 3600 + mRef.current * 60 + v);
  }, [onChange]);

  return (
    <View style={styles.container}>
      <Column items={HOURS}   selected={h} onSelect={updateH} label="hr"  />
      <Column items={MINUTES} selected={m} onSelect={updateM} label="min" />
      <Column items={SECONDS} selected={s} onSelect={updateS} label="sec" />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
});

const col = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  topFade: {
    height: PAD,
    backgroundColor: 'rgba(10,10,10,0.65)',
  },
  selector: {
    height: ITEM_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#555',
  },
  bottomFade: {
    height: PAD,
    backgroundColor: 'rgba(10,10,10,0.65)',
  },
  label: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
});
