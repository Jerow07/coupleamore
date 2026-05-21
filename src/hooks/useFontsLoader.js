// Hook auxiliar para cargar las fuentes tipográficas de la app.
// Las fuentes se cargan vía URL (Google Fonts CDN), sin paquetes adicionales.

import { useFonts } from 'expo-font';

// URLs de las fuentes desde Google Fonts CDN
const FONT_SOURCES = {
  Fraunces_400Regular: {
    uri: 'https://fonts.gstatic.com/s/fraunces/v24/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uZmO_Q5m9IzRFOvE.woff2',
  },
  Fraunces_700Bold: {
    uri: 'https://fonts.gstatic.com/s/fraunces/v24/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uZmO_Q5m9IzRFOvE.woff2',
  },
  Nunito_400Regular: {
    uri: 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDDkhRjtnhmkiRQ.woff2',
  },
  Nunito_600SemiBold: {
    uri: 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDGUkRjtnhmkiRQ.woff2',
  },
  Nunito_700Bold: {
    uri: 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDFwkRjtnhmkiRQ.woff2',
  },
};

/**
 * Carga Fraunces (display) y Nunito (cuerpo) desde Google Fonts CDN.
 *
 * @returns {{ fontsLoaded: boolean, fontError: Error|null }}
 */
export function useFontsLoader() {
  const [fontsLoaded, fontError] = useFonts(FONT_SOURCES);
  return { fontsLoaded, fontError };
}
