import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistance } from '../utils/haversine';
import { CLOSE_THRESHOLD_METERS } from '../config/constants';
import { useTheme } from '../context/ThemeContext';

export default function DistanceCard({ distanceMeters, partnerName, isClose }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const hasDistance = distanceMeters !== null && distanceMeters !== undefined;

  const borderColor = isClose ? colors.coralDark : colors.border;
  const gradientColors = isClose
    ? ['rgba(255, 77, 109, 0.18)', 'rgba(255, 107, 107, 0.10)']
    : isDark
      ? ['rgba(30, 18, 22, 0.7)', 'rgba(26, 16, 21, 0.5)']
      : ['rgba(245, 225, 232, 0.9)', 'rgba(251, 240, 243, 0.7)'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor }]}
    >
      <View style={styles.distanceRow}>
        {hasDistance ? (
          <Text style={[styles.distanceNumber, isClose && styles.distanceNumberClose]}>
            {formatDistance(distanceMeters)}
          </Text>
        ) : (
          <Text style={styles.distancePlaceholder}>— —</Text>
        )}
      </View>
      <Text style={[styles.subtitle, isClose && styles.subtitleClose]}>
        {isClose ? '¡Ya casi se encuentran! 💕'
          : partnerName ? `hacia ${partnerName}`
          : 'Esperando a tu pareja…'}
      </Text>
    </LinearGradient>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    card: {
      borderRadius: 20, borderWidth: 1,
      paddingVertical: 16, paddingHorizontal: 24,
      alignItems: 'center', backgroundColor: 'transparent', overflow: 'hidden',
    },
    distanceRow: { flexDirection: 'row', alignItems: 'baseline' },
    distanceNumber: { fontFamily: 'Fraunces_700Bold', fontSize: 48, color: colors.textPrimary, letterSpacing: -1 },
    distanceNumberClose: { color: colors.coralDark },
    distancePlaceholder: { fontFamily: 'Fraunces_400Regular', fontSize: 48, color: colors.textMuted },
    subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    subtitleClose: { color: colors.coral, fontFamily: 'Nunito_600SemiBold' },
  });
}
