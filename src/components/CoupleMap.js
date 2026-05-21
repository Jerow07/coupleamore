// Archivo de resolución: Metro usa CoupleMap.web.js en web y CoupleMap.native.js en nativo.
// Este archivo es el fallback para entornos donde la resolución por plataforma no aplica.
// En la práctica, Metro prioriza .web.js / .native.js / .js en ese orden.

// Fallback seguro — en web Metro usa CoupleMap.web.js; en nativo, CoupleMap.native.js
import { View } from 'react-native';
export default function CoupleMap() { return null; }
