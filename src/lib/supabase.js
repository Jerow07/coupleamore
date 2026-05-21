// Cliente Supabase con AsyncStorage como adaptador de sesión

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Faltan variables de entorno. Copiá .env.example a .env.local y completá las keys.'
  );
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Garantiza que exista una sesión anónima activa.
 * Supabase Auth Anonymous debe estar habilitado en el proyecto.
 *
 * @returns {Promise<import('@supabase/supabase-js').Session|null>}
 */
export async function ensureAnonSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('[Supabase] Error al crear sesión anónima:', error.message);
    return null;
  }
  return data.session;
}
