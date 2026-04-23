import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

// ── Content ────────────────────────────────────────────────────────────────────

const sections = [
  {
    heading: 'How it works',
    body: `A session is a stack of modules. Each module is a timed segment — a pose, a break, a transition, whatever you need. You build the stack, hit Start, and the app calls time. You focus on the room.

The app announces each module by name when it starts, dings when it ends, and moves on automatically. You don't have to touch anything once the session is running.`,
  },
  {
    heading: 'Building a session',
    body: `Tap any session on the home screen to open it in the builder. Tap "+ New Session" to start fresh.

Set your total session length at the top. The fill bar shows how much of that time you've allocated — amber means room left, red means you've gone over.

To add a module, tap "+ Add Module." Give it a type (Pose or Break), a duration, and an optional name. You can also set:

  • Lead-in — a 10-second "get ready" countdown before the timer starts. Useful when the model needs a moment to get into position.

  • Verbal warning — the app will say "two minutes remaining" (or whatever threshold you set) before the module ends.

Tap a module to edit it. Use the arrows to reorder. The copy icon duplicates it — handy for repeating the same pose duration several times in a row.`,
  },
  {
    heading: 'During a session',
    body: `The big number is time remaining in the current module. Below it: the module name, its total duration, and what's coming up next.

  • Pause — freezes the timer. The session picks up exactly where it left off when you resume.

  • Skip — ends the current module early and moves to the next one.

  • Stop — ends the session and returns to the home screen.

Lock your screen and walk away. The app will ding at the end of every module even while the phone is locked. When you come back, the display jumps to wherever the session actually is.`,
  },
  {
    heading: 'Saving and reusing',
    body: `Tap "Save" in the builder to save your session as a preset. Give it a name you'll recognize — something like "Tuesday gestures" or "Long pose night."

Saved presets appear on the home screen. Tap one to open it in the builder, review it, adjust it if needed, and start it from there.

To delete a preset, press and hold it on the home screen until the delete prompt appears.

The starter preset — the Classic 2-Hour Session — is a fully editable example. Change it, save it as something new, or delete it entirely. It won't come back.`,
  },
  {
    heading: 'The sounds',
    body: `Single ding — a module is starting.

Double ding — a module just ended.

Voice — the module name and duration, spoken at the start of each segment. If a module has a lead-in, the voice speaks during that 10-second window so the model has time to settle.

The app also speaks a verbal warning before a module ends, if you've set one. "Two minutes remaining" means two minutes remaining. Not a suggestion.`,
  },
];

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function HelpScreen({}: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {sections.map((s, i) => (
        <View key={i} style={styles.section}>
          <Text style={styles.heading}>{s.heading}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}

      <Text style={styles.footer}>
        Long-press any preset on the home screen to delete it.{'\n'}
        That's pretty much everything.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 24,
    paddingBottom: 60,
    gap: 36,
  },
  section: {
    gap: 12,
  },
  heading: {
    color: '#c8803c',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    color: '#444',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 12,
  },
});
