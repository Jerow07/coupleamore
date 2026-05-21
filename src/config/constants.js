// Constantes globales de la app

export const APP_VERSION = '1.6';

/** Distancia mínima en metros antes de emitir un nuevo punto GPS */
export const GPS_DISTANCE_INTERVAL = 4;

/** Intervalo máximo en ms entre actualizaciones GPS */
export const GPS_TIME_INTERVAL = 1000;

/** Umbral en metros para activar la celebración de cercanía */
export const CLOSE_THRESHOLD_METERS = 50;

/** Longitud del código de sala */
export const ROOM_CODE_LENGTH = 6;

/** Charset para generar códigos de sala */
export const ROOM_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Canal prefix para Supabase Realtime */
export const CHANNEL_PREFIX = 'room-';

/** Evento de broadcast para compartir ubicación */
export const LOCATION_EVENT = 'location';

/** Tiempo de animación de interpolación del partner (ms) */
export const POSITION_INTERPOLATION_MS = 600;

/** Debounce para fitBounds del mapa (ms) */
export const FIT_BOUNDS_DEBOUNCE_MS = 800;
