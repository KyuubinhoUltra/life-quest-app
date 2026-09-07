import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constants/supabase-config';

// expo-router's web output does a Node-side render pass with no `window`,
// where the Supabase client would otherwise try to read storage eagerly on
// construction and crash. Native (window aliases global) and real browser
// runs are unaffected by this guard.
const isServer = typeof window === 'undefined';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: isServer ? undefined : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
