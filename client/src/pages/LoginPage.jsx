import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            const user = await login(email, password);
            toast.success(`Welcome back, ${user.name}!`);
            navigate(user.role === 'admin' ? '/admin' : '/author', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (e, em, pw) => {
        e.preventDefault();
        setEmail(em);
        setPassword(pw);
    };

    return (
        <div className="login-page">
            <div className="login-card fade-in">
                <div className="login-logo">
                    <div className="login-logo-icon">📚</div>
                    <div className="login-title">BookLeaf Publishing</div>
                    <div className="login-subtitle">Author Support Portal</div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address <span className="required">*</span></label>
                        <input
                            id="login-email"
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password <span className="required">*</span></label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ paddingRight: '42px' }}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', fontSize: '16px',
                                }}
                            >
                                {showPassword ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        className="btn btn-primary w-full btn-lg"
                        disabled={loading}
                        style={{ marginTop: '4px' }}
                    >
                        {loading ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span> Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <div className="divider"></div>

                {/* Quick Logins for Demo */}
                <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>
                        Quick Demo Login
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                            id="quick-admin"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => quickLogin(e, 'admin@bookleafpub.com', 'admin123')}
                            style={{ justifyContent: 'center' }}
                        >
                            Admin
                        </button>
                        <button
                            id="quick-author"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => quickLogin(e, 'priya.sharma@email.com', 'password123')}
                            style={{ justifyContent: 'center' }}
                        >
                            Author
                        </button>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                        Click a button above to auto-fill credentials, then Sign In
                    </p>
                </div>
            </div>
        </div>
    );
}
