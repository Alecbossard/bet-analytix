import { createBrowserClient } from '@supabase/ssr';

// Check if Supabase environment variables are configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a mock client for build time / when env vars are missing
        console.warn('Supabase environment variables not configured');
        return null;
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for client-side usage
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
    if (typeof window === 'undefined') {
        // Server-side: always create new instance
        return createClient();
    }

    if (!supabaseClient) {
        supabaseClient = createClient();
    }
    return supabaseClient;
}
