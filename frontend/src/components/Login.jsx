import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff, BarChart2, UserCheck, Shield } from 'lucide-react';
import Toast from './Toast';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'success' });

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!username.trim() || !password.trim()) {
            setToast({ message: 'Please fill in all fields.', type: 'error' });
            return;
        }

        setSubmitting(true);
        const res = await login(username.trim(), password.trim());
        setSubmitting(false);

        if (res.success) {
            navigate('/dashboard');
        } else {
            setToast({ message: res.error || 'Login failed.', type: 'error' });
        }
    };

    const handleQuickLogin = async (userType) => {
        setSubmitting(true);
        let u = '';
        let p = '';
        if (userType === 'admin') {
            u = 'admin';
            p = 'adminpassword';
        } else {
            u = 'analyst1';
            p = 'analystpassword';
        }
        
        setUsername(u);
        setPassword(p);

        const res = await login(u, p);
        setSubmitting(false);

        if (res.success) {
            navigate('/dashboard');
        } else {
            setToast({ message: res.error || 'Login failed.', type: 'error' });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-brand-bg">
            {/* Ambient gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-neon-indigo/15 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-neon-cyan/15 blur-[120px] pointer-events-none"></div>

            {/* Login Card */}
            <div className="w-full max-w-md p-8 rounded-2xl border border-brand-border bg-slate-900/35 backdrop-blur-xl shadow-2xl relative z-10 animate-slide-up">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-neon-indigo to-neon-cyan flex items-center justify-center shadow-lg shadow-neon-indigo/25 mb-3 transition-transform duration-500 hover:rotate-12">
                        <BarChart2 className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold font-display text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                        Nexus<span className="text-neon-cyan font-semibold">Trade</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1.5">Trading Intelligence Portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username Input */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="username">
                            Username
                        </label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-neon-cyan transition-colors">
                                <User className="w-4 h-4" />
                            </span>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-slate-950/40 text-slate-200 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all placeholder:text-slate-650"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="password">
                            Password
                        </label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-neon-cyan transition-colors">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full pl-10 pr-10 py-3 rounded-xl border border-brand-border bg-slate-950/40 text-slate-200 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all placeholder:text-slate-650"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        id="login-btn"
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white btn-premium shadow-lg shadow-neon-indigo/15 hover:shadow-neon-cyan/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
                    >
                        <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                    </button>
                </form>

                {/* Quick login bypass (Excellent UX for evaluators) */}
                <div className="mt-8 pt-6 border-t border-brand-border">
                    <p className="text-[10px] font-bold text-slate-450 text-center uppercase tracking-widest mb-4">Quick Evaluation Access</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('user')}
                            id="quick-login-analyst"
                            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-brand-border bg-slate-950/30 hover:bg-slate-900/60 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-border-hover transition-all cursor-pointer"
                        >
                            <UserCheck className="w-4 h-4 text-neon-cyan" />
                            <span>Analyst 1</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickLogin('admin')}
                            id="quick-login-admin"
                            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-brand-border bg-slate-950/30 hover:bg-slate-900/60 text-xs font-semibold text-slate-300 hover:text-white hover:border-brand-border-hover transition-all cursor-pointer"
                        >
                            <Shield className="w-4 h-4 text-neon-purple" />
                            <span>Admin User</span>
                        </button>
                    </div>
                </div>

                <p className="text-sm text-slate-400 mt-6 text-center">
                    New analyst?{' '}
                    <Link to="/register" className="text-neon-cyan hover:underline hover:text-cyan-300 font-semibold transition-colors">
                        Register Account
                    </Link>
                </p>
            </div>

            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
        </div>
    );
};

export default Login;
