/* ============================================================================
   OAK & GRAIN INTERIORS — Supabase Client Configuration
   ----------------------------------------------------------------------------
   PASTE YOUR SUPABASE CREDENTIALS HERE:
   1. Go to https://supabase.com -> Open your project.
   2. Navigate to Project Settings (gear icon) -> API.
   3. Copy "Project URL" and paste it into `url` below.
   4. Copy "anon" / "publishable" Project API key and paste it into `anonKey` below.
   ============================================================================ */

const SUPABASE_CONFIG = {
  url: 'https://xlinrvkgechtqxutpvdh.supabase.co',
  anonKey: 'sb_publishable_RP7XGX1fQAjRxjQpY5dodw_m8ZhQZqx',
};

/**
 * Sanitizes the Supabase Project URL to prevent PostgREST PGRST125:
 * "Invalid path specified in request URL."
 * Strips accidental trailing slashes and /rest/v1 duplicates.
 */
function sanitizeSupabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  return rawUrl.trim()
    .replace(/\/+$/, '')               // Remove trailing slashes
    .replace(/\/rest\/v1\/?$/, '')     // Remove accidental /rest/v1 suffix
    .replace(/\/+$/, '');              // Clean trailing slashes again
}

/**
 * Returns true if the user has replaced placeholder credentials with valid ones.
 */
function isSupabaseConfigured() {
  return typeof SUPABASE_CONFIG !== 'undefined' &&
         SUPABASE_CONFIG.url &&
         SUPABASE_CONFIG.anonKey &&
         SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' &&
         !SUPABASE_CONFIG.url.includes('YOUR_SUPABASE') &&
         SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
         SUPABASE_CONFIG.anonKey.length > 20;
}

/**
 * Singleton Supabase Client instance initialized once via official browser CDN.
 */
window.supabaseClient = null;

function getSupabase() {
  if (window.supabaseClient) return window.supabaseClient;
  if (typeof supabase === 'undefined') {
    console.warn('[Oak & Grain] Supabase SDK script not loaded yet.');
    return null;
  }
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const cleanUrl = sanitizeSupabaseUrl(SUPABASE_CONFIG.url);
    const cleanKey = SUPABASE_CONFIG.anonKey.trim();

    window.supabaseClient = supabase.createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'oak_grain_admin_auth'
      }
    });

    console.info('[Oak & Grain] Supabase client initialized successfully with endpoint:', cleanUrl);
    return window.supabaseClient;
  } catch (err) {
    console.error('[Oak & Grain] Error initializing Supabase client:', err);
    return null;
  }
}

// Immediate initialization if Supabase CDN is already present
if (typeof supabase !== 'undefined' && isSupabaseConfigured()) {
  getSupabase();
}

/**
 * Log customer or administrative events to the activity_logs table.
 * Accurately tracks button interactions without claiming call completion.
 */
async function logActivity(eventType, description, metadata = {}) {
  try {
    const client = getSupabase();
    if (!client) {
      console.info(`[Activity Log: ${eventType}]`, description, metadata);
      return;
    }
    await client.from('activity_logs').insert([{
      event_type: eventType,
      description: description,
      metadata: Object.assign({}, metadata, {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    }]);
  } catch (err) {
    // Non-blocking error handling
    console.warn('[Oak & Grain] Activity log error (non-blocking):', err);
  }
}
