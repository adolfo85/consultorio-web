import { createClient } from '@supabase/supabase-js';

// *** ATENCIÓN ***
// Configuración de conexión a Supabase
// URL y Key proporcionadas por el usuario

const SUPABASE_URL = 'https://wmjkwighslhprhktvtej.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_8o2fdV692RlieWdFSLNnFA_kVvSGcxk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper para saber si la conexión está configurada
export const isSupabaseConfigured = () => {
    return (SUPABASE_URL as string) !== 'ACA_TU_URL_DE_SUPABASE' && (SUPABASE_ANON_KEY as string) !== 'ACA_TU_KEY_ANONIMA';
}