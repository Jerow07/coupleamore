import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, SafeAreaView, StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

import CoupleMap from '../components/CoupleMap';
import DistanceCard from '../components/DistanceCard';
import Celebration from '../components/Celebration';
import ShareToggle from '../components/ShareToggle';
import RoomCodeBadge from '../components/RoomCodeBadge';

import { useLocation } from '../hooks/useLocation';
import { useRoom } from '../hooks/useRoom';
import { haversine } from '../utils/haversine';
import { CLOSE_THRESHOLD_METERS, APP_VERSION } from '../config/constants';
import { useTheme } from '../context/ThemeContext';

let Haptics = null;
if (Platform.OS !== 'web') {
  try { Haptics = require('expo-haptics'); } catch { Haptics = null; }
}

export default function RoomScreen({ roomCode, userName, avatar, onLeave }) {
  const { colors, isDark, toggle } = useTheme();
  const [sharing, setSharing] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const wasCloseRef = useRef(false);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    window.history.pushState({ room: true }, '');
    const handlePop = () => onLeave();
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [onLeave]);

  const { location, error: locationError, loading: locationLoading } = useLocation(sharing);

  const { partner, partnerOnline, channelReady } = useRoom({
    roomCode, userName, avatar,
    myLocation: sharing ? location : null,
  });

  const distanceMeters = useMemo(() => {
    if (!location || !partner) return null;
    return haversine(location.lat, location.lon, partner.lat, partner.lon);
  }, [location, partner]);

  const isClose = distanceMeters !== null && distanceMeters < CLOSE_THRESHOLD_METERS;

  useEffect(() => {
    if (isClose && !wasCloseRef.current) {
      setCelebrate(true);
      if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    wasCloseRef.current = isClose;
  }, [isClose]);

  useEffect(() => { if (!isClose) setCelebrate(false); }, [isClose]);

  const handleToggleSharing = useCallback(() => setSharing((v) => !v), []);

  const meForMap = useMemo(() => {
    if (!location) return null;
    return { lat: location.lat, lon: location.lon, name: userName, avatar: avatar || null };
  }, [location, userName, avatar]);

  const connectionStatus = useMemo(() => {
    if (!channelReady) return 'Conectando…';
    if (!partnerOnline) return 'Esperando a tu pareja…';
    return null;
  }, [channelReady, partnerOnline]);

  const headerBg = isDark
    ? ['rgba(26,16,21,0.95)', 'rgba(26,16,21,0.75)', 'transparent']
    : ['rgba(251,240,243,0.95)', 'rgba(251,240,243,0.75)', 'transparent'];

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Celebration active={celebrate} />

      <LinearGradient colors={headerBg} style={styles.header} pointerEvents="box-none">
        <RoomCodeBadge roomCode={roomCode} />
        <View style={styles.headerRight}>
          {connectionStatus ? (
            <Text style={styles.statusText}>{connectionStatus}</Text>
          ) : (
            <Text style={styles.onlineText}>● Pareja conectada</Text>
          )}
          <TouchableOpacity onPress={toggle} style={styles.themeBtn} activeOpacity={0.7}>
            <Text style={styles.themeBtnText}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.mapContainer}>
        {meForMap ? (
          <CoupleMap me={meForMap} partner={partner} closeThresholdMeters={CLOSE_THRESHOLD_METERS} isDark={isDark} />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              {locationLoading ? 'Obteniendo ubicación…'
                : locationError ? locationError
                : sharing ? 'Esperando GPS…'
                : 'Ubicación desactivada'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPanel}>
        <DistanceCard distanceMeters={distanceMeters} partnerName={partner?.name || null} isClose={isClose} />

        <View style={styles.actions}>
          <ShareToggle sharing={sharing} onToggle={handleToggleSharing} />
          <TouchableOpacity style={styles.leaveBtn} onPress={onLeave} activeOpacity={0.8}>
            <Text style={styles.leaveBtnText}>Salir de la sala</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.versionText}>v{APP_VERSION} ✓</Text>
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: '100vh', backgroundColor: colors.bg },
    header: {
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) + 8 : 52,
      paddingBottom: 16, paddingHorizontal: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textMuted },
    onlineText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.coral },
    themeBtn: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: colors.bgCard,
      borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    themeBtnText: { fontSize: 15 },
    mapContainer: { flex: 1, backgroundColor: colors.bg },
    mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    mapPlaceholderText: {
      fontFamily: 'Nunito_400Regular', fontSize: 15,
      color: colors.textMuted, textAlign: 'center', paddingHorizontal: 24,
    },
    bottomPanel: {
      backgroundColor: colors.bottomPanel,
      borderTopWidth: 1, borderTopColor: colors.border,
      paddingHorizontal: 20, paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 56,
      gap: 14,
    },
    actions: { gap: 10 },
    leaveBtn: {
      paddingVertical: 13, borderRadius: 14, borderWidth: 1,
      borderColor: colors.border, alignItems: 'center',
      backgroundColor: colors.bgCard,
    },
    leaveBtnText: { fontFamily: 'Nunito_400Regular', fontSize: 15, color: colors.textMuted },
    versionText: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  });
}
