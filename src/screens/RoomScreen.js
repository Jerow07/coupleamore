// Pantalla principal de la sala: mapa + distancia + controles

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Importación platform-aware del mapa
import CoupleMap from '../components/CoupleMap';
import DistanceCard from '../components/DistanceCard';
import Celebration from '../components/Celebration';
import ShareToggle from '../components/ShareToggle';
import RoomCodeBadge from '../components/RoomCodeBadge';

import { useLocation } from '../hooks/useLocation';
import { useRoom } from '../hooks/useRoom';
import { haversine } from '../utils/haversine';
import { CLOSE_THRESHOLD_METERS, APP_VERSION } from '../config/constants';
import { COLORS } from '../config/theme';

// En nativo, disparar haptics solo si disponible
let Haptics = null;
if (Platform.OS !== 'web') {
  try {
    Haptics = require('expo-haptics');
  } catch {
    Haptics = null;
  }
}

/**
 * @param {{ roomCode: string, userName: string, avatar: string|null, onLeave: () => void }} props
 */
export default function RoomScreen({ roomCode, userName, avatar, onLeave }) {
  const [sharing, setSharing] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const wasCloseRef = useRef(false);

  // Interceptar botón Back de Android en web para volver al home en vez de cerrar la app
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    window.history.pushState({ room: true }, '');
    const handlePop = () => onLeave();
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [onLeave]);

  // GPS activo solo cuando sharing === true
  const { location, error: locationError, loading: locationLoading } = useLocation(sharing);

  // Canal Supabase Realtime
  const { partner, partnerOnline, channelReady } = useRoom({
    roomCode,
    userName,
    avatar,
    myLocation: sharing ? location : null,
  });

  // Distancia calculada (memoizada para evitar recomputo innecesario)
  const distanceMeters = useMemo(() => {
    if (!location || !partner) return null;
    return haversine(location.lat, location.lon, partner.lat, partner.lon);
  }, [location, partner]);

  const isClose = distanceMeters !== null && distanceMeters < CLOSE_THRESHOLD_METERS;

  // Detectar cruce del umbral → celebración
  useEffect(() => {
    if (isClose && !wasCloseRef.current) {
      // Cruce de lejos→cerca
      setCelebrate(true);
      // Haptics solo en nativo
      if (Haptics) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }
    wasCloseRef.current = isClose;
  }, [isClose]);

  // Resetear celebración al alejarse
  useEffect(() => {
    if (!isClose) setCelebrate(false);
  }, [isClose]);

  const handleToggleSharing = useCallback(() => {
    setSharing((v) => !v);
  }, []);

  // Construir objeto "me" para el mapa
  const meForMap = useMemo(() => {
    if (!location) return null;
    return { lat: location.lat, lon: location.lon, name: userName, avatar: avatar || null };
  }, [location, userName, avatar]);

  // Estado de conexión
  const connectionStatus = useMemo(() => {
    if (!channelReady) return 'Conectando…';
    if (!partnerOnline) return 'Esperando a tu pareja…';
    return null;
  }, [channelReady, partnerOnline]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Capa celebración (encima de todo, sin bloquear interacción) */}
      <Celebration active={celebrate} />

      {/* Header translúcido */}
      <LinearGradient
        colors={['rgba(26,16,21,0.95)', 'rgba(26,16,21,0.75)', 'transparent']}
        style={styles.header}
        pointerEvents="box-none"
      >
        <RoomCodeBadge roomCode={roomCode} />
        {connectionStatus ? (
          <Text style={styles.statusText}>{connectionStatus}</Text>
        ) : (
          <Text style={styles.onlineText}>● Pareja conectada</Text>
        )}
      </LinearGradient>

      {/* Mapa (~62% del alto) */}
      <View style={styles.mapContainer}>
        {meForMap ? (
          <CoupleMap
            me={meForMap}
            partner={partner}
            closeThresholdMeters={CLOSE_THRESHOLD_METERS}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              {locationLoading
                ? 'Obteniendo ubicación…'
                : locationError
                ? locationError
                : sharing
                ? 'Esperando GPS…'
                : 'Ubicación desactivada'}
            </Text>
          </View>
        )}
      </View>

      {/* Panel inferior */}
      <View style={styles.bottomPanel}>
        <DistanceCard
          distanceMeters={distanceMeters}
          partnerName={partner?.name || null}
          isClose={isClose}
        />

        <View style={styles.actions}>
          <ShareToggle sharing={sharing} onToggle={handleToggleSharing} />

          <TouchableOpacity style={styles.leaveBtn} onPress={onLeave} activeOpacity={0.8}>
            <Text style={styles.leaveBtnText}>Salir de la sala</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.versionText}>v{APP_VERSION}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: COLORS.bg,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 8 : 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  onlineText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: COLORS.coral,
  },
  mapContainer: {
    flex: 1, // ocupa el espacio restante arriba del panel
    backgroundColor: COLORS.bg,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1015',
  },
  mapPlaceholderText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottomPanel: {
    backgroundColor: 'rgba(26,16,21,0.97)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 56,
    gap: 14,
  },
  actions: {
    gap: 10,
  },
  leaveBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  leaveBtnText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.textMuted,
  },
  versionText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.15)',
    textAlign: 'center',
    marginTop: 4,
  },
});
