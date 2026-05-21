import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Share, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function RoomCodeBadge({ roomCode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleShare = useCallback(async () => {
    const base = Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : 'https://coupleamore.vercel.app';
    const url = `${base}/?room=${roomCode}`;
    const message = `¡Unite a mi sala en Couple Distance! 💕\n${url}`;

    if (Platform.OS === 'web') {
      if (navigator.share) {
        try { await navigator.share({ title: 'Couple Distance', text: message, url }); } catch {}
      } else {
        try { await navigator.clipboard.writeText(url); } catch {}
      }
      return;
    }
    try { await Share.share({ message }); } catch {}
  }, [roomCode]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sala</Text>
      <View style={styles.codeWrapper}>
        {roomCode.split('').map((char, i) => (
          <Text key={i} style={styles.codeChar}>{char}</Text>
        ))}
      </View>
      <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.7}>
        <Text style={styles.shareIcon}>↑</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.bgCard,
      borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14,
      borderWidth: 1, borderColor: colors.border, gap: 8,
    },
    label: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textMuted },
    codeWrapper: { flexDirection: 'row', gap: 3 },
    codeChar: { fontFamily: 'Fraunces_700Bold', fontSize: 16, color: colors.coral, letterSpacing: 1 },
    shareBtn: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: 'rgba(255, 107, 107, 0.15)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    shareIcon: { color: colors.coral, fontSize: 14, fontWeight: 'bold' },
  });
}
