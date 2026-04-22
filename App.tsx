import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { configureAudioSession, configureNotificationHandler, requestNotificationPermissions, initBestVoice, setAppVolume } from './src/audio';
import { hasOnboarded } from './src/storage';
import { loadVolume } from './src/settings';

// Keep splash visible until we're ready to show the app
SplashScreen.preventAutoHideAsync();
import { RootStackParamList } from './src/types';
import HomeScreen from './src/screens/HomeScreen';
import BuilderScreen from './src/screens/BuilderScreen';
import PlayerScreen from './src/screens/PlayerScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HelpScreen from './src/screens/HelpScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // null = still checking storage; true/false = known
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Home' | null>(null);

  useEffect(() => {
    configureNotificationHandler();
    configureAudioSession().catch(console.error);
    requestNotificationPermissions().catch(console.error);
    initBestVoice().catch(console.error);
    loadVolume().then(setAppVolume).catch(console.error);

    Promise.all([
      hasOnboarded(),
      new Promise<void>(resolve => setTimeout(resolve, 3000)),
    ]).then(([done]) => {
      setInitialRoute(done ? 'Home' : 'Onboarding');
      SplashScreen.hideAsync();
    });
  }, []);

  // Hold a blank dark screen while we check storage — avoids a flash
  if (!initialRoute) {
    return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0a0a0a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Life Drawing Timer' }}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
          options={{ title: 'How it works' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="Builder"
          component={BuilderScreen}
          options={{ title: 'Session' }}
        />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            title: '',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
