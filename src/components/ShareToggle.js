// Botón toggle para activar/desactivar el compartir ubicación

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../config/theme';

/**
 * @param {{ sharing: boolean, onToggle: () => void, disabled?: boolean }} props
 */
export default function ShareToggle({ sharing, onToggle, disabled }) {
  if (sharing) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.activeButton]}
        onPress={onToggle}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={styles.indicator} />
        <Text style={styles.activeText}>Compartiendo ubicación</Text>
      </TouchableOpacity>
    );
  }

  return (
    <LinearGradient
      colors={['rgba(255, 107, 107, 0.15)', 'rgba(255, 143, 163, 0.1)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientWrapper}
    >
      <TouchableOpacity
        style={styles.inactiveInner}
        onPress={onToggle}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.inactiveText}>⚪ Compartir ubicación</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
  },
  activeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderColor: COLORS.coral,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.coral,
    marginRight: 8,
  },
  activeText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: COLORS.coral,
  },
  gradientWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inactiveInner: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  inactiveText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
