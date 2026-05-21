// Implementación web del mapa usando Leaflet nativo en el DOM

import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { MY_PIN_COLOR, PARTNER_PIN_COLOR, LINE_COLOR, LINE_CLOSE_COLOR } from '../config/theme';
import { CLOSE_THRESHOLD_METERS, FIT_BOUNDS_DEBOUNCE_MS } from '../config/constants';

// Importar Leaflet en web (solo disponible en browser)
let L = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  // Inyectar CSS de Leaflet si no está ya en el documento
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
}

/**
 * Mapa Leaflet + OSM para web.
 * Renderiza directamente en el DOM, actualiza marcadores sin recargar.
 *
 * @param {{ me, partner, closeThresholdMeters, onRecenter }} props
 */
export default function CoupleMap({
  me,
  partner,
  closeThresholdMeters = CLOSE_THRESHOLD_METERS,
  onRecenter,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const myMarkerRef = useRef(null);
  const partnerMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const fitBoundsTimerRef = useRef(null);

  // Inicializar mapa al montar
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([-34.6, -58.4], 14);

    // Tiles OSM con atribución obligatoria
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      myMarkerRef.current = null;
      partnerMarkerRef.current = null;
      polylineRef.current = null;
    };
  }, []);

  // Crear ícono avatar circular con divIcon
  function createAvatarIcon(name, avatar, color) {
    const initials = name ? name.slice(0, 2).toUpperCase() : '?';
    const imgHtml = avatar
      ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="${initials}" />`
      : `<span style="font-size:13px;font-weight:bold;color:#FFF0F3;font-family:sans-serif;">${initials}</span>`;

    const html = `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:38px;height:38px;border-radius:50%;
          border:2.5px solid ${color};
          background:#1A1015;
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;
          box-shadow:0 2px 10px ${color}80;
        ">${imgHtml}</div>
        <div style="width:2px;height:8px;background:${color};border-radius:0 0 2px 2px;"></div>
        <div style="
          font-size:10px;font-family:sans-serif;
          color:#FFF0F3;background:rgba(26,16,21,0.85);
          padding:1px 5px;border-radius:8px;margin-top:2px;white-space:nowrap;
        ">${name || '...'}</div>
      </div>`;

    return L.divIcon({
      html,
      className: '',
      iconSize: [50, 65],
      iconAnchor: [25, 55],
      popupAnchor: [0, -55],
    });
  }

  // Calcular distancia Haversine
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Programar fitBounds con debounce
  function scheduleFitBounds(mePos, partnerPos) {
    if (fitBoundsTimerRef.current) clearTimeout(fitBoundsTimerRef.current);
    fitBoundsTimerRef.current = setTimeout(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (mePos && partnerPos) {
        const dist = haversine(mePos.lat, mePos.lon, partnerPos.lat, partnerPos.lon);
        // Si están en el mismo punto (< 5m), setView en vez de fitBounds para evitar zoom roto
        if (dist < 5) {
          map.setView([mePos.lat, mePos.lon], 17);
        } else {
          const bounds = L.latLngBounds(
            [mePos.lat, mePos.lon],
            [partnerPos.lat, partnerPos.lon]
          );
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
        }
      } else if (mePos) {
        map.setView([mePos.lat, mePos.lon], 16);
      }
    }, FIT_BOUNDS_DEBOUNCE_MS);
  }

  // Actualizar marcadores cuando cambian las posiciones
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!L || !map || !me) return;

    // Marcador propio
    const myIcon = createAvatarIcon(me.name, me.avatar, MY_PIN_COLOR);
    if (!myMarkerRef.current) {
      myMarkerRef.current = L.marker([me.lat, me.lon], { icon: myIcon }).addTo(map);
    } else {
      myMarkerRef.current.setLatLng([me.lat, me.lon]);
      myMarkerRef.current.setIcon(myIcon);
    }

    // Marcador partner
    if (partner) {
      const partnerIcon = createAvatarIcon(partner.name, partner.avatar, PARTNER_PIN_COLOR);
      if (!partnerMarkerRef.current) {
        partnerMarkerRef.current = L.marker([partner.lat, partner.lon], { icon: partnerIcon }).addTo(map);
      } else {
        partnerMarkerRef.current.setLatLng([partner.lat, partner.lon]);
        partnerMarkerRef.current.setIcon(partnerIcon);
      }
    } else if (partnerMarkerRef.current) {
      map.removeLayer(partnerMarkerRef.current);
      partnerMarkerRef.current = null;
    }

    // Polilínea entre ambos
    if (me && partner) {
      const dist = haversine(me.lat, me.lon, partner.lat, partner.lon);
      const isClose = dist < closeThresholdMeters;
      const color = isClose ? LINE_CLOSE_COLOR : LINE_COLOR;
      const weight = isClose ? 3 : 1.5;
      const dashArray = isClose ? null : '6, 6';

      if (!polylineRef.current) {
        polylineRef.current = L.polyline(
          [[me.lat, me.lon], [partner.lat, partner.lon]],
          { color, weight, dashArray, opacity: 0.8 }
        ).addTo(map);
      } else {
        polylineRef.current.setLatLngs([[me.lat, me.lon], [partner.lat, partner.lon]]);
        polylineRef.current.setStyle({ color, weight, dashArray });
      }
    } else if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    scheduleFitBounds(me, partner);
  }, [me, partner, closeThresholdMeters]);

  const handleRecenter = () => {
    scheduleFitBounds(me, partner);
    if (fitBoundsTimerRef.current) {
      clearTimeout(fitBoundsTimerRef.current);
      fitBoundsTimerRef.current = null;
    }
    const map = mapInstanceRef.current;
    if (map && me) {
      if (partner) {
        const bounds = L.latLngBounds([me.lat, me.lon], [partner.lat, partner.lon]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
      } else {
        map.setView([me.lat, me.lon], 16);
      }
    }
    onRecenter?.();
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          // Filtro cálido sobre tiles OSM
          filter: 'saturate(0.85) brightness(0.9) sepia(0.1)',
        }}
      />
      {/* Botón recentrar */}
      <div
        onClick={handleRecenter}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          zIndex: 1000,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(26, 16, 21, 0.9)',
          border: '1.5px solid rgba(255, 107, 107, 0.5)',
          color: '#FF6B6B',
          fontSize: 18,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          userSelect: 'none',
        }}
        title="Recentrar"
      >
        ⊕
      </div>
    </View>
  );
}
