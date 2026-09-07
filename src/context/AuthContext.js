import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(supabaseConfigured)

    useEffect(() => {
        if (!supabase) return undefined
        let mounted = true
        supabase.auth.getSession().then(({ data }) => {
            if (mounted) {
                setSession(data.session)
                setLoading(false)
            }
        }).catch(() => mounted && setLoading(false))

        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession)
            setLoading(false)
        })
        return () => {
            mounted = false
            if (listener && listener.subscription) listener.subscription.unsubscribe()
        }
    }, [])

    const value = useMemo(() => ({
        session,
        user: session && session.user,
        loading,
        configured: supabaseConfigured,
        signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
        signUp: (email, password) => supabase.auth.signUp({ email, password }),
        resetPassword: email => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
        updatePassword: password => supabase.auth.updateUser({ password }),
        signOut: () => supabase.auth.signOut()
    }), [session, loading])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
