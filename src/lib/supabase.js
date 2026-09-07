// CRA 3's Webpack 4 resolver selects the package's ESM entry point and cannot
// consume its nested CommonJS exports. Requiring the explicit CJS build keeps
// the pinned SDK compatible without changing the React/CRA application stack.
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
