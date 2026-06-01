import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Mail, ShieldAlert, BarChart2 } from 'lucide-react';
import Toast from './Toast';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
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
        const res = await register(username.trim(), email.trim(), password.trim(), role);
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
        <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-slate-950">
            {/* Ambient gradients */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none"></div>

            {/* Register Card */}
            <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-3 animate-pulse">
                        <BarChart2 className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold font-display text-white tracking-tight">Create Account</h1>
                    <p className="text-sm text-slate-400 mt-1">Join the trading intelligence network</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="username">
                            Username
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                                <User className="w-4 h-4" />
                            </span>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose username"
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-950/60 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${errors.username ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                required
                            />
                        </div>
                        {errors.username && <p className="text-rose-455 text-xs mt-1">{errors.username[0]}</p>}
                    </div>

                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                                <Mail className="w-4 h-4" />
                            </span>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="analyst@domain.com"
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-950/60 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                required
                            />
                        </div>
                        {errors.email && <p className="text-rose-455 text-xs mt-1">{errors.email[0]}</p>}
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create secure password"
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-950/60 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${errors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                required
                            />
                        </div>
                        {errors.password && <p className="text-rose-455 text-xs mt-1">{errors.password[0]}</p>}
                    </div>

                    {/* Role Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="role">
                            Analyst Role
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                                <ShieldAlert className="w-4 h-4" />
                            </span>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="user">Standard Analyst (Default)</option>
                                <option value="admin">Administrator / Principal Analyst</option>
                            </select>
                            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 pointer-events-none">
                                ▾
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        id="register-btn"
                        className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4 cursor-pointer"
                    >
                        {submitting ? 'Registering Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="text-sm text-slate-400 mt-6 text-center">
                    Already registered?{' '}
                    <Link to="/login" className="text-cyan-455 hover:underline hover:text-cyan-300 font-medium">
                        Sign In
                    </Link>
                </p>
            </div>

            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
        </div>
    );
};

export default Register;
