// Badge del código de sala con botón de compartir

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Share, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../config/theme';

/**
 * @param {{ roomCode: string }} props
 */
export default function RoomCodeBadge({ roomCode }) {
  const handleShare = useCallback(async () => {
    const message = `¡Unite a mi sala en Couple Distance! Código: ${roomCode}`;

    if (Platform.OS === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Couple Distance', text: message });
        } catch {
          // Usuario canceló
        }
      } else {
        // Copiar al portapapeles como fallback
        try {
          await navigator.clipboard.writeText(roomCode);
          // No podemos mostrar Alert sin React Native modal, simplemente copiamos
        } catch {
          // Silencioso en web sin permiso
        }
      }
      return;
    }

    try {
      await Share.share({ message });
    } catch {
      // Usuario canceló
    }
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 16, 21, 0.85)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  label: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  codeWrapper: {
    flexDirection: 'row',
    gap: 3,
  },
  codeChar: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 16,
    color: COLORS.coral,
    letterSpacing: 1,
  },
  shareBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shareIcon: {
    color: COLORS.coral,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
