// Shared CORS headers for Edge Functions invoked directly by the bl1es-portal SPA via
// `supabase.functions.invoke(...)`. These functions are called with a Bearer token
// (never cookies), so a permissive Access-Control-Allow-Origin is acceptable here —
// authorization itself is enforced inside each function, not by CORS.
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
