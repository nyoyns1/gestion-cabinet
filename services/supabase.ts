import { createClient } from '@supabase/supabase-js';

// Ces variables doivent être définies dans votre projet Vercel (Settings > Environment Variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// On vérifie si les clés existent pour éviter le crash au build time si non configuré
// Note: Pour l'instant l'application utilise mockDb par défaut.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
  
export const isSupabaseConfigured = !!supabase;