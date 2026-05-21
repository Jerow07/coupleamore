import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';

import HomeScreen from './src/screens/HomeScreen';
import RoomScreen from './src/screens/RoomScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const KEY_NAME = 'cd_userName';
const KEY_AVATAR = 'cd_avatar';
const KEY_ROOM = 'cd_lastRoom';

const FONT_SOURCES = {
  Fraunces_400Regular: {
    uri: 'https://fonts.gstatic.com/s/fraunces/v24/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uZmO_Q5m9IzRFOvE.woff2',
  },
  Fraunces_700Bold: {
    uri: 'https://fonts.gstatic.com/s/fraunces/v24/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uZmO_Q5m9IzRFOvE.woff2',
  },
  Nunito_400Regular: {
    uri: 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDDkhRjtnhmkiRQ.woff2',
  },
  Nunito_600SemiBold: {
    uri: 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDGUkRjtnhmkiRQ.woff2',
  },
  Nunito_700Bold: {
    uri: 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDFwkRjtnhmkiRQ.woff2',
  },
};

function AppInner() {
  const { colors } = useTheme();
  const [fontsReady, setFontsReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState('home');
  const [roomCode, setRoomCode] = useState(null);
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setFontsReady(true), 3000);
    Font.loadAsync(FONT_SOURCES)
      .catch(() => {})
      .finally(() => { clearTimeout(t); setFontsReady(true); });
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function hydrate() {
      try {
        const [name, av, room] = await Promise.all([
          AsyncStorage.getItem(KEY_NAME),
          AsyncStorage.getItem(KEY_AVATAR),
          AsyncStorage.getItem(KEY_ROOM),
        ]);
        if (name) setUserName(name);
        if (av) setAvatar(av);

        const urlRoom =
          typeof window !== 'undefined' && window.location?.search
            ? new URLSearchParams(window.location.search).get('room')?.toUpperCase() || null
            : null;

        const targetRoom = urlRoom || room;
        if (targetRoom && name) {
          if (urlRoom) await AsyncStorage.setItem(KEY_ROOM, urlRoom).catch(() => {});
          setRoomCode(targetRoom);
          setScreen('room');
        }
      } catch {
      } finally {
        setHydrated(true);
      }
    }
    hydrate();
  }, []);

  const handleEnterRoom = useCallback(async (code, name, av) => {
    setRoomCode(code);
    setUserName(name);
    setAvatar(av);
    setScreen('room');
    try {
      await Promise.all([
        AsyncStorage.setItem(KEY_NAME, name),
        av ? AsyncStorage.setItem(KEY_AVATAR, av) : AsyncStorage.removeItem(KEY_AVATAR),
        AsyncStorage.setItem(KEY_ROOM, code),
      ]);
    } catch {}
  }, []);

  const handleLeaveRoom = useCallback(async () => {
    try { await AsyncStorage.removeItem(KEY_ROOM); } catch {}
    // Sacar ?room= de la URL para que no vuelva a auto-entrar si recarga o vuelve atrás
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setScreen('home');
    setRoomCode(null);
  }, []);

  if (!fontsReady || !hydrated) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.coral} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {screen === 'home' ? (
        <HomeScreen initialName={userName} initialAvatar={avatar} onEnterRoom={handleEnterRoom} />
      ) : (
        <RoomScreen roomCode={roomCode} userName={userName} avatar={avatar} onLeave={handleLeaveRoom} />
      )}
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, minHeight: '100vh', alignItems: 'center', justifyContent: 'center' },
});
