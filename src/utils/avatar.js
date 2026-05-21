// Utilidades para avatares y colores asociados a nombres

/** Colores cálidos disponibles para generar color a partir de nombre */
const WARM_COLORS = [
  '#FF6B6B',
  '#FF8FA3',
  '#FFB4A2',
  '#FFD6A5',
  '#FF4D6D',
  '#E76F51',
  '#F4A261',
  '#E9C46A',
  '#FF9F1C',
  '#FFBF69',
];

/**
 * Obtiene las iniciales de un nombre (máx 2 letras).
 *
 * @param {string} name - Nombre completo
 * @returns {string} Iniciales en mayúsculas, ej: "AB"
 */
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Devuelve un color cálido determinista basado en el hash del nombre.
 *
 * @param {string} name - Nombre de la persona
 * @returns {string} Color hexadecimal
 */
export function getColorForName(name) {
  if (!name) return WARM_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convertir a int32
  }
  const index = Math.abs(hash) % WARM_COLORS.length;
  return WARM_COLORS[index];
}
