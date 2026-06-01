import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Mail, BarChart2 } from 'lucide-react';
import Toast from './Toast';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ message: '', type: 'success' });

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!username.trim() || !email.trim() || !password.trim()) {
            setToast({ message: 'All fields are required.', type: 'error' });
            return;
        }

        setSubmitting(true);
        // Register standard user strictly
        const res = await register(username.trim(), email.trim(), password.trim());
        setSubmitting(false);

        if (res.success) {
            setToast({ message: 'Account registered successfully! Redirecting...', type: 'success' });
            setTimeout(() => {
                navigate('/login');
            }, 1800);
        } else {
            if (res.errors) {
                setErrors(res.errors);
                const firstErr = Object.keys(res.errors)[0];
                const msg = `${firstErr}: ${res.errors[firstErr][0]}`;
                setToast({ message: msg, type: 'error' });
            } else {
                setToast({ message: res.error || 'Registration failed.', type: 'error' });
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-brand-bg">
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-neon-indigo/15 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-neon-cyan/15 blur-[120px] pointer-events-none"></div>

            {/* Registration Card */}
            <div className="w-full max-w-md p-8 rounded-2xl border border-brand-border bg-slate-900/35 backdrop-blur-xl shadow-2xl relative z-10 animate-slide-up">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-neon-indigo to-neon-cyan flex items-center justify-center shadow-lg shadow-neon-indigo/25 mb-3 transition-transform duration-500 hover:rotate-12">
                        <BarChart2 className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold font-display text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                        Create Account
                    </h1>
                    <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1.5">Join the NexusTrade network</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username Input */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="username">
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
                                placeholder="Choose username"
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-955 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${errors.username ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-brand-border focus:border-neon-cyan focus:ring-neon-cyan/30'}`}
                                required
                            />
                        </div>
                        {errors.username && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.username[0]}</p>}
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-neon-cyan transition-colors">
                                <Mail className="w-4 h-4" />
                            </span>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="analyst@nexustrade.ai"
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-955 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-brand-border focus:border-neon-cyan focus:ring-neon-cyan/30'}`}
                                required
                            />
                        </div>
                        {errors.email && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.email[0]}</p>}
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5" htmlFor="password">
                            Password
                        </label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-neon-cyan transition-colors">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create secure password"
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-955 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${errors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-brand-border focus:border-neon-cyan focus:ring-neon-cyan/30'}`}
                                required
                            />
                        </div>
                        {errors.password && <p className="text-rose-400 text-xs mt-1 font-medium">{errors.password[0]}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        id="register-btn"
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white btn-premium shadow-lg shadow-neon-indigo/15 hover:shadow-neon-cyan/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4 cursor-pointer"
                    >
                        <span>{submitting ? 'Registering Account...' : 'Sign Up'}</span>
                    </button>
                </form>

                <p className="text-sm text-slate-400 mt-6 text-center">
                    Already registered?{' '}
                    <Link to="/login" className="text-neon-cyan hover:underline hover:text-cyan-300 font-semibold transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>

            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
        </div>
    );
};

export default Register;
