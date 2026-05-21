import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native';

function getRoomFromUrl() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('room')?.toUpperCase() || null;
}

import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AvatarPicker from '../components/AvatarPicker';
import { useTheme } from '../context/ThemeContext';
import { ROOM_CODE_LENGTH, ROOM_CODE_CHARSET, APP_VERSION } from '../config/constants';

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARSET[Math.floor(Math.random() * ROOM_CODE_CHARSET.length)];
  }
  return code;
}

export default function HomeScreen({ initialName, initialAvatar, onEnterRoom }) {
  const { colors, isDark, toggle } = useTheme();
  const [name, setName] = useState(initialName || '');
  const [avatar, setAvatar] = useState(initialAvatar || null);
  const urlRoom = getRoomFromUrl();
  const [joinCode, setJoinCode] = useState(urlRoom || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (urlRoom && initialName) onEnterRoom(urlRoom, initialName, initialAvatar);
  }, []);

  const validate = useCallback(() => {
    if (!name.trim()) { setError('Escribí tu nombre para continuar.'); return false; }
    setError('');
    return true;
  }, [name]);

  const handleCreate = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    const code = generateRoomCode();
    await new Promise((r) => setTimeout(r, 200));
    setLoading(false);
    onEnterRoom(code, name.trim(), avatar);
  }, [validate, name, avatar, onEnterRoom]);

  const handleJoin = useCallback(async () => {
    if (!validate()) return;
    const code = joinCode.trim().toUpperCase();
    if (code.length !== ROOM_CODE_LENGTH) {
      setError(`El código debe tener ${ROOM_CODE_LENGTH} caracteres.`);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 100));
    setLoading(false);
    onEnterRoom(code, name.trim(), avatar);
  }, [validate, joinCode, name, avatar, onEnterRoom]);

  const gradientColors = isDark
    ? ['#1A1015', '#241018', '#1A1015']
    : ['#FBF0F3', '#F5E1E8', '#FBF0F3'];

  return (
    <LinearGradient colors={gradientColors} style={styles.gradient}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Toggle tema */}
      <TouchableOpacity style={styles.themeBtn} onPress={toggle} activeOpacity={0.7}>
        <Text style={styles.themeBtnText}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Couple{'\n'}Distance</Text>
            <Text style={styles.subtitle}>Siempre cerca, siempre juntos 💕</Text>
          </View>

          <View style={styles.profileSection}>
            <AvatarPicker name={name} avatarUri={avatar} onAvatarChange={setAvatar} />
            <TextInput
              style={styles.nameInput}
              placeholder="Tu nombre"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(t) => { setName(t); setError(''); }}
              maxLength={24}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.coral, colors.coralDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryBtnInner}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Crear nueva sala</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>o</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={styles.joinSection}>
            <TextInput
              style={styles.codeInput}
              placeholder={`Código de sala (${ROOM_CODE_LENGTH} letras)`}
              placeholderTextColor={colors.textMuted}
              value={joinCode}
              onChangeText={(t) => { setJoinCode(t.toUpperCase()); setError(''); }}
              maxLength={ROOM_CODE_LENGTH}
              autoCapitalize="characters"
              returnKeyType="join"
              onSubmitEditing={handleJoin}
            />
            <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} disabled={loading} activeOpacity={0.85}>
              <Text style={styles.joinBtnText}>Unirse a sala</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>
            No se guarda ningún dato personal.{'\n'}Conexión en tiempo real con Supabase.
          </Text>
          <Text style={styles.versionText}>v{APP_VERSION} ✓</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    gradient: { flex: 1, minHeight: '100vh' },
    themeBtn: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 52 : 36,
      right: 20,
      zIndex: 10,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeBtnText: { fontSize: 18 },
    scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 36 },
    title: { fontFamily: 'Fraunces_700Bold', fontSize: 52, color: colors.textPrimary, textAlign: 'center', lineHeight: 56 },
    subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: colors.textSecondary, marginTop: 10, textAlign: 'center' },
    profileSection: { alignItems: 'center', gap: 16, marginBottom: 24, width: '100%' },
    nameInput: {
      width: '100%', backgroundColor: colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, paddingHorizontal: 18,
      paddingVertical: 14, fontFamily: 'Nunito_400Regular', fontSize: 16, color: colors.textPrimary,
    },
    errorText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: colors.coral, marginBottom: 12, textAlign: 'center' },
    primaryBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
    primaryBtnInner: { paddingVertical: 16, alignItems: 'center' },
    primaryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#fff' },
    separator: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20, gap: 12 },
    separatorLine: { flex: 1, height: 1, backgroundColor: colors.border },
    separatorText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: colors.textMuted },
    joinSection: { width: '100%', gap: 12, marginBottom: 32 },
    codeInput: {
      width: '100%', backgroundColor: colors.bgCard, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, paddingHorizontal: 18,
      paddingVertical: 14, fontFamily: 'Fraunces_400Regular', fontSize: 20,
      color: colors.coral, letterSpacing: 4, textAlign: 'center',
    },
    joinBtn: {
      width: '100%', paddingVertical: 15, borderRadius: 14,
      borderWidth: 1.5, borderColor: colors.coral, alignItems: 'center',
      backgroundColor: 'rgba(255, 107, 107, 0.08)',
    },
    joinBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: colors.coral },
    footerNote: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
    versionText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  });
}
