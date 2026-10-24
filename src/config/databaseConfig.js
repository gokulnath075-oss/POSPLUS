// Central Database Configuration for Automatic Multi-Device Synchronization
// Configured with shop Supabase credentials. All counters (Counter 1, Counter 2, Mobile)
// connect and synchronize automatically with zero setup required on each terminal!

export const DEFAULT_SUPABASE_URL = 'https://ujsnfrvozqlzcvrmiqtk.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqc25mcnZvenFsemN2cm1pcXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NDE2NDEsImV4cCI6MjEwODMxNzY0MX0.BIhdEzZEAo0xqdcAXrI6MkvmbtsTvqlxoJU2QaYFwzM';

export function getEffectiveCloudCredentials(settings) {
  const url = settings?.supabaseUrl || DEFAULT_SUPABASE_URL;
  const key = settings?.supabaseAnonKey || DEFAULT_SUPABASE_KEY;
  const isConfigured = Boolean(url && key && url.includes('supabase.co'));
  return { url, key, isConfigured };
}
