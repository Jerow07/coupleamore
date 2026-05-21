import React, { useMemo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function ShareToggle({ sharing, onToggle, disabled }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (sharing) {
    return (
      <TouchableOpacity style={styles.activeButton} onPress={onToggle} disabled={disabled} activeOpacity={0.8}>
        <View style={styles.indicator} />
        <Text style={styles.activeText}>Compartiendo ubicación</Text>
      </TouchableOpacity>
    );
  }

  return (
    <LinearGradient
      colors={['rgba(255, 107, 107, 0.15)', 'rgba(255, 143, 163, 0.1)']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      style={styles.gradientWrapper}
    >
      <TouchableOpacity style={styles.inactiveInner} onPress={onToggle} disabled={disabled} activeOpacity={0.8}>
        <Text style={styles.inactiveText}>⚪ Compartir ubicación</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    activeButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1,
      backgroundColor: 'rgba(255, 107, 107, 0.12)', borderColor: colors.coral,
    },
    indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral, marginRight: 8 },
    activeText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: colors.coral },
    gradientWrapper: { borderRadius: 14, borderWidth: 1, borderColor: colors.border },
    inactiveInner: { paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
    inactiveText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: colors.textSecondary },
  });
}
