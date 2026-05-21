// Hook para obtener y monitorear la ubicación GPS del usuario

import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { GPS_DISTANCE_INTERVAL, GPS_TIME_INTERVAL } from '../config/constants';

/**
 * Monitorea la ubicación GPS del usuario.
 *
 * @param {boolean} enabled - Si es false, no pide permisos ni inicia el watch
 * @returns {{ location: {lat, lon} | null, error: string | null, loading: boolean }}
 */
export function useLocation(enabled = true) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const watchRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      // Limpiar watch si se desactiva
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      return;
    }

    let cancelled = false;

    async function startWatching() {
      setLoading(true);
      setError(null);

      try {
        // En web, navigator.geolocation funciona directamente
        if (Platform.OS === 'web') {
          if (!navigator?.geolocation) {
            setError('Tu navegador no soporta geolocalización.');
            setLoading(false);
            return;
          }

          // Pedir permiso implícito en web
          watchRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              if (!cancelled) {
                setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                setLoading(false);
                setError(null);
              }
            },
            (err) => {
              if (!cancelled) {
                if (err.code === 1) {
                  setError('Permiso de ubicación denegado. Habilitalo en la configuración del navegador.');
                } else {
                  setError('No se pudo obtener la ubicación: ' + err.message);
                }
                setLoading(false);
              }
            },
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
          );
          return;
        }

        // Nativo: pedir permisos explícitos
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setError('Permiso de ubicación denegado. Habilitalo en Ajustes.');
            setLoading(false);
          }
          return;
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: GPS_DISTANCE_INTERVAL,
            timeInterval: GPS_TIME_INTERVAL,
          },
          (pos) => {
            if (!cancelled) {
              setLocation({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
              });
              setLoading(false);
              setError(null);
            }
          }
        );

        if (!cancelled) {
          watchRef.current = subscription;
        } else {
          subscription.remove();
        }
      } catch (err) {
        if (!cancelled) {
          setError('Error al iniciar GPS: ' + err.message);
          setLoading(false);
        }
      }
    }

    startWatching();

    return () => {
      cancelled = true;
      if (watchRef.current) {
        if (Platform.OS === 'web') {
          navigator.geolocation.clearWatch(watchRef.current);
        } else {
          watchRef.current.remove();
        }
        watchRef.current = null;
      }
    };
  }, [enabled]);

  return { location, error, loading };
}
