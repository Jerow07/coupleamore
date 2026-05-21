// Implementación nativa del mapa usando WebView con Leaflet por CDN

import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { generateLeafletHtml } from '../utils/leafletHtml';

/**
 * Mapa Leaflet para nativo (iOS/Android) embebido en WebView.
 * Comunica posiciones vía injectJavaScript.
 *
 * @param {{ me, partner, closeThresholdMeters, onRecenter }} props
 */
export default function CoupleMap({ me, partner, closeThresholdMeters, onRecenter }) {
  const webViewRef = useRef(null);
  // Generamos el HTML una sola vez
  const htmlContent = useRef(generateLeafletHtml()).current;

  // Enviar posiciones al WebView
  const injectPositions = useCallback((mePos, partnerPos) => {
    if (!webViewRef.current || !mePos) return;

    const meJson = JSON.stringify(mePos);
    const partnerJson = partnerPos ? JSON.stringify(partnerPos) : 'null';

    const script = `
      (function() {
        if (typeof window.updatePositions === 'function') {
          window.updatePositions(${meJson}, ${partnerJson});
        }
      })();
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }, []);

  useEffect(() => {
    injectPositions(me, partner);
  }, [me, partner, injectPositions]);

  // Recibir mensajes desde el WebView (ej: botón recentrar)
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'recenter') {
        onRecenter?.();
      }
    } catch (e) {
      // Ignorar mensajes mal formados
    }
  }, [onRecenter]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        // Permitir acceso a geolocalización y contenido mixto
        geolocationEnabled={false} // La ubicación la maneja RN
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        // No mostrar scroll horizontal en iOS
        scrollEnabled={false}
        bounces={false}
        onLoadEnd={() => {
          // Al cargar, inyectar posición inicial si ya tenemos una
          if (me) {
            setTimeout(() => injectPositions(me, partner), 300);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#1A1015',
  },
});
