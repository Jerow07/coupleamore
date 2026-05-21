// App principal: carga fuentes, rehidrata sesión, navega entre Home y Room

import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';

import HomeScreen from './src/screens/HomeScreen';
import RoomScreen from './src/screens/RoomScreen';
import { COLORS } from './src/config/theme';

// Claves de persistencia en AsyncStorage
const KEY_NAME = 'cd_userName';
const KEY_AVATAR = 'cd_avatar';
const KEY_ROOM = 'cd_lastRoom';

// Fuentes por URL (no requiere archivos locales; funciona en web y nativo con expo-font)
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

export default function App() {
  const [fontsReady, setFontsReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Estado de navegación
  const [screen, setScreen] = useState('home'); // 'home' | 'room'
  const [roomCode, setRoomCode] = useState(null);
  const [userName, setUserName] = useState('');
  const [avatar, setAvatar] = useState(null);

  // Cargar fuentes
  useEffect(() => {
    const t = setTimeout(() => setFontsReady(true), 3000);
    Font.loadAsync(FONT_SOURCES)
      .catch(() => {})
      .finally(() => { clearTimeout(t); setFontsReady(true); });
    return () => clearTimeout(t);
  }, []);

  // Rehidratar datos persistidos y auto-entrar a sala guardada
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
        // Si hay sala y nombre guardados, entrar directo
        if (room && name) {
          setRoomCode(room);
          setScreen('room');
        }
      } catch {
        // Silencioso si AsyncStorage falla
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
        av
          ? AsyncStorage.setItem(KEY_AVATAR, av)
          : AsyncStorage.removeItem(KEY_AVATAR),
        AsyncStorage.setItem(KEY_ROOM, code),
      ]);
    } catch {
      // Silencioso
    }
  }, []);

  const handleLeaveRoom = useCallback(async () => {
    setScreen('home');
    setRoomCode(null);
    try {
      await AsyncStorage.removeItem(KEY_ROOM);
    } catch {
      // Silencioso
    }
  }, []);

  // Mostrar spinner mientras carga recursos iniciales
  if (!fontsReady || !hydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={COLORS.coral} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {screen === 'home' ? (
        <HomeScreen
          initialName={userName}
          initialAvatar={avatar}
          onEnterRoom={handleEnterRoom}
        />
      ) : (
        <RoomScreen
          roomCode={roomCode}
          userName={userName}
          avatar={avatar}
          onLeave={handleLeaveRoom}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
