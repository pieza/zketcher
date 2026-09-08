const { createClient } = require('@supabase/supabase-js/dist/index.cjs')

const url = process.env.REACT_APP_SUPABASE_URL
const publishableKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    })
    : null

export const supabaseConfigured = Boolean(supabase)
