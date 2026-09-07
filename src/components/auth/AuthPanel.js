import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const AuthPanel = () => {
    const { configured, signIn, signUp, resetPassword, updatePassword } = useAuth()
    const [mode, setMode] = useState('sign-in')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const recovery = typeof window !== 'undefined' && window.location.hash.indexOf('type=recovery') !== -1

    const submit = async event => {
        event.preventDefault()
        setError('')
        setMessage('')
        setBusy(true)
        try {
            if (recovery) {
                await updatePassword(newPassword)
                setMessage('Your password has been updated. You can keep playing.')
                window.history.replaceState({}, document.title, window.location.pathname)
            } else if (mode === 'reset') {
                await resetPassword(email)
                setMessage('If an account exists for that email, a reset link is on its way.')
            } else {
                const { data, error: authError } = mode === 'sign-in'
                    ? await signIn(email, password)
                    : await signUp(email, password)
                if (authError) throw authError
                if (mode === 'sign-up' && !data.session) {
                    setMessage('Account created. If email confirmation is enabled in Supabase, confirm it before signing in.')
                }
            }
        } catch (authError) {
            setError(authError.message || 'Authentication failed.')
        } finally {
            setBusy(false)
        }
    }

    if (!configured) {
        return <p className="alert alert-warning mb-0">Supabase is not configured. Copy <code>.env.example</code> to your environment and add the project URL and publishable key.</p>
    }

    return (
        <div className="auth-panel">
            <div className="btn-group btn-group-sm mb-3" role="group" aria-label="Authentication mode">
                <button type="button" className={`btn ${mode === 'sign-in' ? 'btn-main' : 'btn-outline-secondary'}`} onClick={() => setMode('sign-in')}>Sign in</button>
                <button type="button" className={`btn ${mode === 'sign-up' ? 'btn-main' : 'btn-outline-secondary'}`} onClick={() => setMode('sign-up')}>Sign up</button>
                <button type="button" className={`btn ${mode === 'reset' ? 'btn-main' : 'btn-outline-secondary'}`} onClick={() => setMode('reset')}>Reset password</button>
            </div>
            <form onSubmit={submit}>
                <div className="form-group">
                    <label htmlFor="auth-email">Email</label>
                    <input id="auth-email" type="email" className="form-control" value={email} onChange={event => setEmail(event.target.value)} required />
                </div>
                {recovery ? <div className="form-group">
                    <label htmlFor="new-password">New password</label>
                    <input id="new-password" type="password" className="form-control" value={newPassword} onChange={event => setNewPassword(event.target.value)} minLength="6" required />
                </div> : mode !== 'reset' && <div className="form-group">
                    <label htmlFor="auth-password">Password</label>
                    <input id="auth-password" type="password" className="form-control" value={password} onChange={event => setPassword(event.target.value)} minLength="6" required />
                </div>}
                {error && <div className="alert alert-danger">{error}</div>}
                {message && <div className="alert alert-info">{message}</div>}
                <button type="submit" className="btn btn-main btn-block" disabled={busy}>
                    {busy ? 'Working…' : recovery ? 'Update password' : mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : 'Send reset link'}
                </button>
            </form>
        </div>
    )
}

export default AuthPanel
