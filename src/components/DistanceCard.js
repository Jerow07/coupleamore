// Tarjeta de vidrio que muestra la distancia entre los dos usuarios

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistance } from '../utils/haversine';
import { CLOSE_THRESHOLD_METERS } from '../config/constants';
import { COLORS } from '../config/theme';

/**
 * @param {{ distanceMeters: number|null, partnerName: string, isClose: boolean }} props
 */
export default function DistanceCard({ distanceMeters, partnerName, isClose }) {
  const hasDistance = distanceMeters !== null && distanceMeters !== undefined;

  // Colores base
  const borderColor = isClose ? COLORS.coralDark : COLORS.border;
  const gradientColors = isClose
    ? ['rgba(255, 77, 109, 0.15)', 'rgba(255, 107, 107, 0.08)']
    : ['rgba(30, 18, 22, 0.7)', 'rgba(26, 16, 21, 0.5)'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor }]}
    >
      {/* Número de distancia */}
      <View style={styles.distanceRow}>
        {hasDistance ? (
          <Text style={[styles.distanceNumber, isClose && styles.distanceNumberClose]}>
            {formatDistance(distanceMeters)}
          </Text>
        ) : (
          <Text style={styles.distancePlaceholder}>— —</Text>
        )}
      </View>

      {/* Subtítulo */}
      <Text style={[styles.subtitle, isClose && styles.subtitleClose]}>
        {isClose
          ? '¡Ya casi se encuentran! 💕'
          : partnerName
          ? `hacia ${partnerName}`
          : 'Esperando a tu pareja…'}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    // Efecto glass: blur no disponible nativo sin librería, simulamos con opacidad
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  distanceNumber: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 48,
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  distanceNumberClose: {
    color: COLORS.coralDark,
  },
  distancePlaceholder: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 48,
    color: COLORS.textMuted,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  subtitleClose: {
    color: COLORS.coral,
    fontFamily: 'Nunito_600SemiBold',
  },
});
