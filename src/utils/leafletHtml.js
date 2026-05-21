// Genera el HTML completo para cargar Leaflet vía CDN en un WebView nativo

import { MY_PIN_COLOR, PARTNER_PIN_COLOR, LINE_COLOR, LINE_CLOSE_COLOR } from '../config/theme';
import { CLOSE_THRESHOLD_METERS, FIT_BOUNDS_DEBOUNCE_MS } from '../config/constants';

/**
 * Genera un HTML autocontenido con Leaflet + OSM para usar en WebView.
 * Expone `window.updatePositions(me, partner)` para actualizar marcadores sin recargar.
 *
 * @returns {string} HTML completo como string
 */
export function generateLeafletHtml() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Couple Distance Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WLs=" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #1A1015; }
    #map {
      width: 100%;
      height: 100%;
      /* Filtro cálido sobre tiles OSM */
      filter: saturate(0.85) brightness(0.9) sepia(0.1);
    }
    /* Recenter button */
    #recenter-btn {
      position: absolute;
      bottom: 12px;
      right: 12px;
      z-index: 1000;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(26, 16, 21, 0.9);
      border: 1.5px solid rgba(255, 107, 107, 0.5);
      color: #FF6B6B;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    /* Estilos del pin avatar */
    .pin-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .pin-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 2.5px solid #FF6B6B;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      font-family: sans-serif;
      background: #1A1015;
      color: #FFF0F3;
      box-shadow: 0 2px 10px rgba(255,107,107,0.5);
    }
    .pin-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .pin-tail {
      width: 2px;
      height: 8px;
      background: #FF6B6B;
      border-radius: 0 0 2px 2px;
    }
    .pin-name {
      font-size: 10px;
      font-family: sans-serif;
      color: #FFF0F3;
      background: rgba(26,16,21,0.8);
      padding: 1px 5px;
      border-radius: 8px;
      margin-top: 2px;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <button id="recenter-btn" onclick="recenterMap()" title="Recentrar">⊕</button>

  <script>
    const MY_COLOR = '${MY_PIN_COLOR}';
    const PARTNER_COLOR = '${PARTNER_PIN_COLOR}';
    const LINE_COLOR = '${LINE_COLOR}';
    const LINE_CLOSE_COLOR = '${LINE_CLOSE_COLOR}';
    const CLOSE_THRESHOLD = ${CLOSE_THRESHOLD_METERS};
    const FIT_DEBOUNCE = ${FIT_BOUNDS_DEBOUNCE_MS};

    // Inicializar mapa
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
    }).setView([-34.6, -58.4], 14);

    // Tiles OSM con atribución obligatoria
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 19,
    }).addTo(map);

    let myMarker = null;
    let partnerMarker = null;
    let polyline = null;
    let fitBoundsTimer = null;
    let lastMe = null;
    let lastPartner = null;

    function createAvatarIcon(name, avatarUri, color, isMe) {
      const initials = name ? name.slice(0,2).toUpperCase() : '?';
      const imgHtml = avatarUri
        ? \`<img src="\${avatarUri}" alt="\${initials}" />\`
        : initials;
      const html = \`
        <div class="pin-wrapper">
          <div class="pin-avatar" style="border-color:\${color}; box-shadow: 0 2px 10px \${color}80;">
            \${imgHtml}
          </div>
          <div class="pin-tail" style="background:\${color};"></div>
          <div class="pin-name">\${name || '...'}</div>
        </div>
      \`;
      return L.divIcon({
        html,
        className: '',
        iconSize: [50, 65],
        iconAnchor: [25, 55],
        popupAnchor: [0, -55],
      });
    }

    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371000;
      const toRad = d => d * Math.PI / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat/2)**2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    function scheduleFitBounds() {
      if (fitBoundsTimer) clearTimeout(fitBoundsTimer);
      fitBoundsTimer = setTimeout(() => {
        if (lastMe && lastPartner) {
          const bounds = L.latLngBounds(
            [lastMe.lat, lastMe.lon],
            [lastPartner.lat, lastPartner.lon]
          );
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
        } else if (lastMe) {
          map.setView([lastMe.lat, lastMe.lon], 16);
        }
      }, FIT_DEBOUNCE);
    }

    function updatePolyline() {
      if (!lastMe || !lastPartner) {
        if (polyline) { map.removeLayer(polyline); polyline = null; }
        return;
      }
      const dist = haversine(lastMe.lat, lastMe.lon, lastPartner.lat, lastPartner.lon);
      const isClose = dist < CLOSE_THRESHOLD;
      const color = isClose ? LINE_CLOSE_COLOR : LINE_COLOR;
      const weight = isClose ? 3 : 1.5;
      const dashArray = isClose ? null : '6, 6';

      if (!polyline) {
        polyline = L.polyline(
          [[lastMe.lat, lastMe.lon], [lastPartner.lat, lastPartner.lon]],
          { color, weight, dashArray, opacity: 0.8 }
        ).addTo(map);
      } else {
        polyline.setLatLngs([[lastMe.lat, lastMe.lon], [lastPartner.lat, lastPartner.lon]]);
        polyline.setStyle({ color, weight, dashArray });
      }
    }

    // Función pública para actualizar posiciones desde RN
    window.updatePositions = function(me, partner) {
      lastMe = me;
      lastPartner = partner || null;

      // Actualizar marcador propio
      const myIcon = createAvatarIcon(me.name, me.avatar, MY_COLOR, true);
      if (!myMarker) {
        myMarker = L.marker([me.lat, me.lon], { icon: myIcon }).addTo(map);
      } else {
        myMarker.setLatLng([me.lat, me.lon]);
        myMarker.setIcon(myIcon);
      }

      // Actualizar marcador del partner
      if (partner) {
        const partnerIcon = createAvatarIcon(partner.name, partner.avatar, PARTNER_COLOR, false);
        if (!partnerMarker) {
          partnerMarker = L.marker([partner.lat, partner.lon], { icon: partnerIcon }).addTo(map);
        } else {
          partnerMarker.setLatLng([partner.lat, partner.lon]);
          partnerMarker.setIcon(partnerIcon);
        }
      } else if (partnerMarker) {
        map.removeLayer(partnerMarker);
        partnerMarker = null;
      }

      updatePolyline();
      scheduleFitBounds();
    };

    function recenterMap() {
      // Notificar a RN si existe el bridge
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'recenter' }));
      }
      scheduleFitBounds();
    }
  </script>
</body>
</html>`;
}
