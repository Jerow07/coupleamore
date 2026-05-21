# Couple Distance

App PWA/móvil que permite a dos personas compartir su ubicación GPS en tiempo real, ver un mapa con sus posiciones y la distancia entre ellas.

## Stack

- Expo SDK 51 · React Native 0.74
- NativeWind v4 (Tailwind CSS)
- Leaflet + OpenStreetMap (mapa, sin API key)
- Supabase Realtime (Broadcast + Presence, sin tablas)
- expo-location, expo-haptics, expo-image-picker

---

## 1. Setup Supabase

1. Crear proyecto en [supabase.com](https://supabase.com).
2. En **Settings → API**, copiar la URL del proyecto y la `anon public key`.
3. Copiar `.env.example` a `.env.local` y completar:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
4. En **Authentication → Providers**, habilitar **Anonymous sign-in**.
5. **No se crean tablas**: el MVP usa solo Realtime Broadcast + Presence. Sin RLS necesaria.

---

## 2. Arranque en desarrollo

```bash
npm install
npx expo start
# Presionar 'w' para abrir en el navegador (PWA)
# Presionar 'i' para iOS simulator
# Presionar 'a' para Android emulator
```

## 3. Build PWA para deploy

```bash
npx expo export -p web
# Genera carpeta dist/ lista para Vercel / Netlify / cualquier hosting estático
```

## 4. Instalar como PWA en el celular

1. Abrir la URL del deploy en Chrome/Safari del celular.
2. **Android**: menú → "Agregar a pantalla de inicio".
3. **iOS**: Safari → botón compartir → "Agregar a pantalla de inicio".

---

## 5. Ajustar intervalo GPS

En `src/config/constants.js`:

```js
export const GPS_DISTANCE_INTERVAL = 4;  // metros mínimos entre updates
export const GPS_TIME_INTERVAL = 1000;   // ms máximos entre updates
```

Reducir `GPS_DISTANCE_INTERVAL` a 1 para mayor precisión (más consumo de batería).

---

## 6. Mapa OSM

- Tiles de OpenStreetMap: gratis, sin API key.
- **Atribución obligatoria** © OpenStreetMap contributors (ya incluida en el mapa).
- **En web**: Leaflet corre nativo en el DOM (`CoupleMap.web.js`).
- **En nativo**: Leaflet embebido en WebView via HTML autocontenido (`CoupleMap.native.js`). El puente RN→WebView usa `injectJavaScript` para actualizar marcadores sin recargar la página.

---

## 7. Arquitectura de datos (sin base de datos)

```
[Usuario A] --broadcast--> [Canal room:CODIGO] <--broadcast-- [Usuario B]
             <--presence-->                    <--presence-->
```

- Cada usuario emite su ubicación cada vez que el GPS actualiza.
- `presence` detecta si la pareja está online/offline.
- No se persiste ninguna ubicación en Supabase.

---

## 8. Estructura de archivos

```
amorejoy/
├── App.js                    ← Punto de entrada, nav Home↔Room
├── app.json                  ← Config Expo + PWA manifest
├── babel.config.js
├── metro.config.js           ← NativeWind integrado
├── tailwind.config.js        ← Paleta cálida + fuentes
├── global.css                ← @tailwind directives
├── .env.example              ← Variables de entorno
└── src/
    ├── lib/supabase.js       ← Cliente + ensureAnonSession()
    ├── utils/
    │   ├── haversine.js      ← Distancia GPS en metros
    │   ├── avatar.js         ← Iniciales + color por nombre
    │   └── leafletHtml.js    ← HTML Leaflet para WebView
    ├── config/
    │   ├── constants.js      ← GPS_DISTANCE_INTERVAL, etc.
    │   └── theme.js          ← Paleta de colores
    ├── hooks/
    │   ├── useLocation.js    ← GPS watchPosition
    │   ├── useRoom.js        ← Supabase Realtime
    │   └── useFontsLoader.js ← expo-font (opcional)
    ├── screens/
    │   ├── HomeScreen.js     ← Nombre + avatar + crear/unirse
    │   └── RoomScreen.js     ← Mapa + distancia + controles
    └── components/
        ├── CoupleMap.web.js  ← Leaflet en DOM (web)
        ├── CoupleMap.native.js ← Leaflet en WebView (nativo)
        ├── CoupleMap.js      ← Fallback Metro
        ├── DistanceCard.js   ← Tarjeta distancia glass
        ├── Celebration.js    ← Lluvia de corazones Reanimated
        ├── ShareToggle.js    ← Toggle compartir ubicación
        ├── RoomCodeBadge.js  ← Código + botón compartir
        └── AvatarPicker.js   ← Foto o iniciales
```
