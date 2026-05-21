/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine.
 *
 * @param {number} lat1 - Latitud del punto 1 en grados decimales
 * @param {number} lon1 - Longitud del punto 1 en grados decimales
 * @param {number} lat2 - Latitud del punto 2 en grados decimales
 * @param {number} lon2 - Longitud del punto 2 en grados decimales
 * @returns {number} Distancia en metros
 */
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio terrestre en metros
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formatea metros en string legible (m o km).
 *
 * @param {number} meters - Distancia en metros
 * @returns {string} Ej: "124 m" o "1.3 km"
 */
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
