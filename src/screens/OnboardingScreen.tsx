import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { markOnboarded } from '../storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const pages = [
  {
    icon: '⏱',
    title: 'A timer built for\nfigure drawing.',
    body:
      "Most timers are just one big countdown. This one lets you build a session out of modules — individual timed segments for gestures, long poses, breaks, whatever you need. Stack them up, hit Start, and the app calls time so you don't have to.",
  },
  {
    icon: '＋',
    title: 'Build it\nyour way.',
    body:
      "Add a module for each part of your session. Give it a name — \"Gesture warm-up,\" \"Break,\" \"20-minute pose\" — and set its duration. The app tells you whether your modules fill the time you have, or leave room for more. Duplicate a module to repeat it without retyping everything.",
  },
  {
    icon: '↗',
    title: 'Save it.\nRun it again.',
    body:
      "Once you've built a session you like, save it as a preset. It'll be waiting on the home screen next time. You can have as many as you want — one for gesture class, one for long pose night, one for that Tuesday workshop that always runs short.",
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [page, setPage] = useState(0);
  const isLast = page === pages.length - 1;

  async function handleNext() {
    if (!isLast) {
      setPage(p => p + 1);
    } else {
      await markOnboarded();
      navigation.replace('Home');
    }
  }

  function handleSkip() {
    markOnboarded();
    navigation.replace('Home');
  }

  const current = pages[page];

  return (
    <SafeAreaView style={styles.container}>

      {/* Skip — top right, always visible */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Page content */}
      <View style={styles.content}>
        <Text style={styles.icon}>{current.icon}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
      </View>

      {/* Bottom: dots + button */}
      <View style={styles.footer}>

        {/* Page dots */}
        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === page && styles.dotActive]}
            />
          ))}
        </View>

        {/* Next / Get Started */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>
            {isLast ? "Let's go" : 'Next'}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    color: '#555',
    fontSize: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  icon: {
    fontSize: 48,
    marginBottom: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
    marginBottom: 24,
  },
  body: {
    color: '#888',
    fontSize: 17,
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 24,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2a2a2a',
  },
  dotActive: {
    backgroundColor: '#c8803c',
    width: 20,
  },
  nextBtn: {
    backgroundColor: '#1a6b3c',
    borderRadius: 14,
    paddingVertical: 18,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
