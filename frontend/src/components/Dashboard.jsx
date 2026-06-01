import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, Edit2, Trash2, LogOut, User, 
    TrendingUp, TrendingDown, Eye, Shield, 
    X, ChevronLeft, ChevronRight, AlertTriangle, 
    Search, RefreshCw, PauseCircle, Database, Calendar,
    UserCheck, Layers, BarChart2
} from 'lucide-react';
import Toast from './Toast';

const Dashboard = () => {
    const { user, logout, fetchWithAuth } = useAuth();
    
    // Core data state
    const [notes, setNotes] = useState([]);
    const [count, setCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchSymbol, setSearchSymbol] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: 'success' });

    // Database aggregate stats state
    const [stats, setStats] = useState({ total: 0, buy: 0, sell: 0, hold: 0, watch: 0 });

    // Modals visibility state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [activeNote, setActiveNote] = useState(null);

    // Form inputs state
    const [formData, setFormData] = useState({
        asset_symbol: '',
        action: 'WATCH',
        price_target: '',
        note: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [modalSubmitting, setModalSubmitting] = useState(false);

    // Fetch database stats (pagination-resilient)
    const loadStats = async () => {
        try {
            const response = await fetchWithAuth('http://localhost:8000/api/v1/notes/stats/');
            if (response.ok) {
                const data = await response.json();
                setStats({
                    total: data.total || 0,
                    buy: data.buy || 0,
                    sell: data.sell || 0,
                    hold: data.hold || 0,
                    watch: data.watch || 0
                });
            }
        } catch (error) {
            console.error('Failed to load dashboard metrics:', error);
        }
    };

    // Load data from API
    const loadNotes = async (page = 1, symbol = '') => {
        setLoading(true);
        try {
            let url = `http://localhost:8000/api/v1/notes/?page=${page}`;
            if (symbol.trim()) {
                url += `&symbol=${encodeURIComponent(symbol.trim())}`;
            }

            const response = await fetchWithAuth(url);
            if (!response.ok) {
                throw new Error('Could not retrieve trade notes.');
            }

            const data = await response.json();
            setNotes(data.results || []);
            setCount(data.count || 0);
            setCurrentPage(page);
        } catch (error) {
            setToast({ message: error.message || 'Error fetching data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotes(1);
        loadStats();
    }, []);

    // Search trigger
    const handleSearch = (e) => {
        e.preventDefault();
        loadNotes(1, searchSymbol);
    };

    const handleClearSearch = () => {
        setSearchSymbol('');
        loadNotes(1, '');
    };

    // Pagination controls
    const totalPages = Math.ceil(count / 10) || 1;
    const handlePrevPage = () => {
        if (currentPage > 1) {
            loadNotes(currentPage - 1, searchSymbol);
        }
    };
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            loadNotes(currentPage + 1, searchSymbol);
        }
    };

    // Form helpers
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear specific field error
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Open Modals
    const openCreateModal = () => {
        setFormData({
            asset_symbol: '',
            action: 'WATCH',
            price_target: '',
            note: ''
        });
        setFormErrors({});
        setShowCreateModal(true);
    };

    const openEditModal = (note) => {
        setActiveNote(note);
        setFormData({
            asset_symbol: note.asset_symbol,
            action: note.action,
            price_target: note.price_target || '',
            note: note.note
        });
        setFormErrors({});
        setShowEditModal(true);
    };

    const openDeleteModal = (note) => {
        setActiveNote(note);
        setShowDeleteModal(true);
    };

    // API CRUD Actions
    const handleCreateNote = async (e) => {
        e.preventDefault();
        setFormErrors({});
        setModalSubmitting(true);

        const payload = {
            ...formData,
            price_target: formData.price_target === '' ? null : parseFloat(formData.price_target)
        };

        try {
            const response = await fetchWithAuth('http://localhost:8000/api/v1/notes/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                setToast({ message: `Successfully added ${data.asset_symbol} trade note!`, type: 'success' });
                setShowCreateModal(false);
                loadNotes(1, searchSymbol); // Refresh list
                loadStats(); // Update dashboard metric stats
            } else {
                setFormErrors(data);
                setToast({ message: 'Validation failed. Please check inputs.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Failed to create trade note.', type: 'error' });
        } finally {
            setModalSubmitting(false);
        }
    };

    const handleEditNote = async (e) => {
        e.preventDefault();
        setFormErrors({});
        setModalSubmitting(true);

        const payload = {
            ...formData,
            price_target: formData.price_target === '' ? null : parseFloat(formData.price_target)
        };

        try {
            const response = await fetchWithAuth(`http://localhost:8000/api/v1/notes/${activeNote.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                setToast({ message: `Updated ${data.asset_symbol} note successfully.`, type: 'success' });
                setShowEditModal(false);
                loadNotes(currentPage, searchSymbol); // Keep on current page
                loadStats(); // Update stats
            } else {
                setFormErrors(data);
                setToast({ message: 'Validation failed. Please check inputs.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Failed to update trade note.', type: 'error' });
        } finally {
            setModalSubmitting(false);
        }
    };

    const handleDeleteNote = async () => {
        setModalSubmitting(true);
        try {
            const response = await fetchWithAuth(`http://localhost:8000/api/v1/notes/${activeNote.id}/`, {
                method: 'DELETE'
            });

            if (response.status === 204) {
                setToast({ message: 'Trade note deleted.', type: 'success' });
                setShowDeleteModal(false);
                const newPage = (notes.length === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
                loadNotes(newPage, searchSymbol);
                loadStats();
            } else {
                const data = await response.json();
                throw new Error(data.detail || 'Could not delete note.');
            }
        } catch (error) {
            setToast({ message: error.message || 'Failed to delete note.', type: 'error' });
        } finally {
            setModalSubmitting(false);
        }
    };

    // Seed additional evaluator data directly via client call
    const handleSeedData = async () => {
        setLoading(true);
        try {
            const response = await fetchWithAuth('http://localhost:8000/api/v1/notes/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset_symbol: 'SOL',
                    action: 'BUY',
                    price_target: 145.20,
                    note: 'SOL is retesting support. Loading swing trade position.'
                })
            });
            if (response.ok) {
                setToast({ message: 'Demo Trade Note created!', type: 'success' });
                loadNotes(1);
                loadStats();
            } else {
                throw new Error('Failed to create demo note.');
            }
        } catch (error) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col font-sans relative">
            {/* Ambient gradients */}
            <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-neon-indigo/5 blur-[120px] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-neon-cyan/5 blur-[120px] pointer-events-none"></div>

            {/* Top Navigation Bar */}
            <nav className="border-b border-brand-border bg-slate-950/45 backdrop-blur-lg sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-indigo to-neon-cyan flex items-center justify-center shadow shadow-neon-indigo/20">
                        <BarChart2 className="w-5.5 h-5.5 text-white" />
                    </div>
                    <span className="font-extrabold text-xl font-display text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                        Nexus<span className="text-neon-cyan font-semibold">Trade</span>
                    </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* User Profile Info Tag */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 rounded-full border border-brand-border bg-slate-900/40">
                        {user?.role === 'admin' ? (
                            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neon-cyan shrink-0 animate-pulse" />
                        ) : (
                            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neon-purple shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-200 max-w-[65px] sm:max-w-none truncate">{user?.username}</span>
                        <span className={`hidden sm:inline-block text-[9px] tracking-wider uppercase font-bold px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20' : 'bg-slate-800 text-slate-400'}`}>
                            {user?.role}
                        </span>
                    </div>

                    {/* Log Out */}
                    <button
                        onClick={logout}
                        id="logout-btn"
                        className="flex items-center gap-2 p-2.5 sm:py-2 sm:px-4 rounded-xl border border-brand-border hover:border-brand-border-hover bg-slate-955/65 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer shadow"
                    >
                        <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-neon-rose" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </nav>

            {/* Dashboard Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 z-10">
                {/* Intro & Actions Panel */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">Watchlist & Notes</h1>
                        <p className="text-sm text-slate-400 mt-1">Manage and track trade signals and market updates.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSeedData}
                            id="demo-seed-btn"
                            className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-brand-border hover:border-brand-border-hover bg-slate-950 hover:bg-slate-900/60 text-xs font-bold text-slate-300 hover:text-slate-100 transition-all cursor-pointer shadow-lg"
                            title="Add a demo note to quickly test CRUD"
                        >
                            <RefreshCw className="w-3.5 h-3.5 text-neon-cyan" />
                            <span>Quick Demo Note</span>
                        </button>

                        <button
                            onClick={openCreateModal}
                            id="create-note-btn"
                            className="flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-white btn-premium shadow-lg shadow-neon-indigo/15 hover:shadow-neon-cyan/25 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-white" />
                            <span>Create Note</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard Metrics Grid (5-column layout displaying aggregate signals) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-slide-up">
                    <div className="p-5 rounded-2xl glass-panel glass-panel-hover glow-total">
                        <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-neon-indigo" />
                            <span>Total Notes</span>
                        </div>
                        <div className="text-3xl font-extrabold font-display text-white mt-3.5">{stats.total}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-2">Database Records</div>
                    </div>
                    <div className="p-5 rounded-2xl glass-panel glass-panel-hover glow-buy">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-neon-emerald" />
                            <span>Buy Signals</span>
                        </div>
                        <div className="text-3xl font-extrabold font-display text-neon-emerald mt-3.5">{stats.buy}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-2">Active Recommendations</div>
                    </div>
                    <div className="p-5 rounded-2xl glass-panel glass-panel-hover glow-sell">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5 text-neon-rose" />
                            <span>Sell Signals</span>
                        </div>
                        <div className="text-3xl font-extrabold font-display text-neon-rose mt-3.5">{stats.sell}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-2">Take Profit / Short</div>
                    </div>
                    <div className="p-5 rounded-2xl glass-panel glass-panel-hover glow-hold">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <PauseCircle className="w-3.5 h-3.5 text-neon-amber" />
                            <span>Hold Signals</span>
                        </div>
                        <div className="text-3xl font-extrabold font-display text-neon-amber mt-3.5">{stats.hold}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-2">Consolidating Positions</div>
                    </div>
                    <div className="p-5 rounded-2xl glass-panel glass-panel-hover glow-watch">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-neon-cyan" />
                            <span>Watch Items</span>
                        </div>
                        <div className="text-3xl font-extrabold font-display text-slate-350 mt-3.5">{stats.watch}</div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mt-2">Pending technical setups</div>
                    </div>
                </div>

                {/* Filter & Table section */}
                <div className="rounded-2xl border border-brand-border bg-slate-900/15 backdrop-blur-xl overflow-hidden shadow-2xl animate-slide-up">
                    {/* Search Panel */}
                    <div className="p-5 border-b border-brand-border bg-slate-900/35 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="w-full sm:max-w-sm flex items-center relative group">
                            <span className="absolute left-3.5 text-slate-500 group-focus-within:text-neon-cyan transition-colors">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                value={searchSymbol}
                                onChange={(e) => setSearchSymbol(e.target.value)}
                                placeholder="Filter by asset symbol (e.g. BTC)..."
                                className="w-full pl-10 pr-12 py-2 border border-brand-border bg-slate-950/60 text-slate-200 text-xs rounded-xl focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all placeholder:text-slate-650"
                                id="symbol-search-input"
                            />
                            {searchSymbol && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3.5 text-slate-450 hover:text-slate-200 cursor-pointer transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </form>

                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            {count === 0 ? 'No notes found' : `Showing ${notes.length} of ${count} notes`}
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse text-left text-slate-300">
                            <thead>
                                <tr className="border-b border-brand-border bg-slate-950/60 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                    <th className="px-6 py-4">Asset</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Price Target</th>
                                    {user?.role === 'admin' && <th className="px-6 py-4">Analyst</th>}
                                    <th className="px-6 py-4">Analysis Note</th>
                                    <th className="px-6 py-4">Date Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/60 bg-slate-950/15">
                                {loading ? (
                                    <tr>
                                        <td colSpan={user?.role === 'admin' ? 7 : 6} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin text-neon-cyan" />
                                                <span className="font-semibold uppercase tracking-wider text-xs">Loading intelligence records...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : notes.length === 0 ? (
                                    <tr>
                                        <td colSpan={user?.role === 'admin' ? 7 : 6} className="px-6 py-12 text-center text-slate-500 text-sm">
                                            No trade notes created yet. Click "Create Note" to add one!
                                        </td>
                                    </tr>
                                ) : (
                                    notes.map((note) => {
                                        const canModify = note.username === user?.username;

                                        let actionBadge = '';
                                        if (note.action === 'BUY') actionBadge = 'bg-neon-emerald/10 text-neon-emerald border-neon-emerald/20 glow-buy';
                                        else if (note.action === 'SELL') actionBadge = 'bg-neon-rose/10 text-neon-rose border-neon-rose/20 glow-sell';
                                        else if (note.action === 'HOLD') actionBadge = 'bg-neon-amber/10 text-neon-amber border-neon-amber/20 glow-hold';
                                        else actionBadge = 'bg-slate-800/40 text-slate-350 border-slate-700/50';

                                        return (
                                            <tr key={note.id} className="hover:bg-slate-900/25 border-b border-brand-border/60 transition-colors text-sm group">
                                                <td className="px-6 py-4 font-bold text-white tracking-wider font-display">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded bg-slate-900/60 flex items-center justify-center border border-brand-border text-[10px] font-extrabold text-neon-cyan">
                                                            {note.asset_symbol.substring(0, 2)}
                                                        </div>
                                                        <span>{note.asset_symbol}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[9px] tracking-wide font-extrabold px-2.5 py-1 rounded-full border ${actionBadge}`}>
                                                        {note.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-300 font-semibold">
                                                    {note.price_target ? `$${parseFloat(note.price_target).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}` : '—'}
                                                </td>
                                                {user?.role === 'admin' && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 rounded-full bg-slate-900 border border-brand-border">
                                                                {note.user_role === 'admin' ? (
                                                                    <Shield className="w-3 h-3 text-neon-cyan" />
                                                                ) : (
                                                                    <User className="w-3 h-3 text-neon-purple" />
                                                                )}
                                                            </div>
                                                            <span className="text-slate-300 font-semibold">{note.username}</span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-slate-400 max-w-xs md:max-w-md truncate font-medium" title={note.note}>
                                                    {note.note}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-3">
                                                    <Calendar className="w-3 h-3 text-slate-600" />
                                                    <span>
                                                        {new Date(note.created_at).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {canModify ? (
                                                        <div className="flex items-center justify-end gap-2.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openEditModal(note)}
                                                                className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-neon-cyan hover:border hover:border-neon-cyan/20 transition-all cursor-pointer"
                                                                title="Edit Note"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(note)}
                                                                className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-neon-rose hover:border hover:border-neon-rose/20 transition-all cursor-pointer"
                                                                title="Delete Note"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider select-none">Read-only</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card-Based Grid View */}
                    <div className="block md:hidden divide-y divide-brand-border/40 bg-slate-950/5">
                        {loading ? (
                            <div className="px-6 py-12 text-center text-slate-400">
                                <div className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin text-neon-cyan" />
                                    <span className="font-semibold uppercase tracking-wider text-xs">Loading records...</span>
                                </div>
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="px-6 py-12 text-center text-slate-500 text-sm">
                                No trade notes created yet. Click "Create Note" to add one!
                            </div>
                        ) : (
                            notes.map((note) => {
                                const canModify = note.username === user?.username;

                                let actionBadge = '';
                                if (note.action === 'BUY') actionBadge = 'bg-neon-emerald/10 text-neon-emerald border-neon-emerald/20 glow-buy';
                                else if (note.action === 'SELL') actionBadge = 'bg-neon-rose/10 text-neon-rose border-neon-rose/20 glow-sell';
                                else if (note.action === 'HOLD') actionBadge = 'bg-neon-amber/10 text-neon-amber border-neon-amber/20 glow-hold';
                                else actionBadge = 'bg-slate-800/40 text-slate-350 border-slate-700/50';

                                return (
                                    <div key={note.id} className="p-5 space-y-4 hover:bg-slate-900/10 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded bg-slate-900/60 flex items-center justify-center border border-brand-border text-xs font-extrabold text-neon-cyan">
                                                    {note.asset_symbol.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white tracking-wider font-display text-sm">{note.asset_symbol}</div>
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-semibold">
                                                        <Calendar className="w-3 h-3 text-slate-600" />
                                                        <span>
                                                            {new Date(note.created_at).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] tracking-wide font-extrabold px-2.5 py-1 rounded-full border ${actionBadge}`}>
                                                {note.action}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/20 p-2.5 rounded-xl border border-brand-border/40">
                                            <div>
                                                <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Price Target</div>
                                                <div className="font-mono font-semibold text-slate-200 mt-0.5">
                                                    {note.price_target ? `$${parseFloat(note.price_target).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}` : '—'}
                                                </div>
                                            </div>
                                            {user?.role === 'admin' && (
                                                <div>
                                                    <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Analyst</div>
                                                    <div className="font-semibold text-slate-200 mt-0.5 truncate">
                                                        {note.username}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-350 leading-relaxed font-medium bg-slate-950/10 p-3 rounded-xl border border-brand-border/30">
                                            {note.note}
                                        </p>

                                        <div className="flex items-center justify-between pt-1">
                                            <div>
                                                {!canModify && (
                                                    <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider select-none">Read-only</span>
                                                )}
                                            </div>
                                            {canModify && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(note)}
                                                        className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-brand-border bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-neon-cyan hover:border-neon-cyan/20 transition-all cursor-pointer"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(note)}
                                                        className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-brand-border bg-slate-955 hover:bg-slate-900 text-xs font-bold text-slate-350 hover:text-neon-rose hover:border-neon-rose/20 transition-all cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-brand-border bg-slate-950/40 flex items-center justify-between">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1 || loading}
                                className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-brand-border hover:border-brand-border-hover bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Previous</span>
                            </button>
                            <span className="text-xs font-semibold text-slate-400">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages || loading}
                                className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-brand-border hover:border-brand-border-hover bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                                <span>Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* CREATE TRADE NOTE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-brand-border bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl relative animate-scale-up">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-extrabold font-display text-white tracking-tight mb-5">Create Trade Note</h2>

                        <form onSubmit={handleCreateNote} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="asset_symbol">
                                    Asset Symbol
                                </label>
                                <input
                                    id="asset_symbol"
                                    type="text"
                                    name="asset_symbol"
                                    value={formData.asset_symbol}
                                    onChange={handleFormChange}
                                    placeholder="e.g. BTC, ETH, SOL"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.asset_symbol ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-brand-border focus:border-neon-cyan focus:ring-neon-cyan/30'}`}
                                    required
                                />
                                {formErrors.asset_symbol && <p className="text-rose-450 text-xs mt-1 font-semibold">{formErrors.asset_symbol[0]}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="action">
                                        Signal Action
                                    </label>
                                    <select
                                        id="action"
                                        name="action"
                                        value={formData.action}
                                        onChange={handleFormChange}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all cursor-pointer font-bold"
                                    >
                                        <option value="BUY">BUY</option>
                                        <option value="SELL">SELL</option>
                                        <option value="HOLD">HOLD</option>
                                        <option value="WATCH">WATCH</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="price_target">
                                        Price Target (USD)
                                    </label>
                                    <input
                                        id="price_target"
                                        type="number"
                                        name="price_target"
                                        step="any"
                                        value={formData.price_target}
                                        onChange={handleFormChange}
                                        placeholder="Optional target"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.price_target ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-brand-border focus:border-neon-cyan focus:ring-neon-cyan/30'}`}
                                    />
                                    {formErrors.price_target && <p className="text-rose-455 text-xs mt-1 font-semibold">{formErrors.price_target[0]}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="note">
                                    Analysis / Note Details
                                </label>
                                <textarea
                                    id="note"
                                    name="note"
                                    rows="4"
                                    value={formData.note}
                                    onChange={handleFormChange}
                                    placeholder="Explain your technical setup..."
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.note ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-brand-border focus:border-neon-cyan focus:ring-neon-cyan/30'}`}
                                    required
                                ></textarea>
                                {formErrors.note && <p className="text-rose-455 text-xs mt-1 font-semibold">{formErrors.note[0]}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="py-2.5 px-4 rounded-xl border border-brand-border bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalSubmitting}
                                    id="submit-create-btn"
                                    className="py-2.5 px-4 rounded-xl font-bold text-white btn-premium shadow shadow-neon-indigo/10 hover:shadow-neon-cyan/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                                >
                                    <span>{modalSubmitting ? 'Creating...' : 'Create Note'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT TRADE NOTE MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-brand-border bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl relative animate-scale-up">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-extrabold font-display text-white tracking-tight mb-5">Edit Trade Note</h2>

                        <form onSubmit={handleEditNote} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="edit_asset_symbol">
                                    Asset Symbol
                                </label>
                                <input
                                    id="edit_asset_symbol"
                                    type="text"
                                    name="asset_symbol"
                                    value={formData.asset_symbol}
                                    onChange={handleFormChange}
                                    placeholder="e.g. BTC, ETH, SOL"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.asset_symbol ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-brand-border focus:border-neon-cyan focus:ring-neon-cyan/30'}`}
                                    required
                                />
                                {formErrors.asset_symbol && <p className="text-rose-455 text-xs mt-1 font-semibold">{formErrors.asset_symbol[0]}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="edit_action">
                                        Signal Action
                                    </label>
                                    <select
                                        id="edit_action"
                                        name="action"
                                        value={formData.action}
                                        onChange={handleFormChange}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all cursor-pointer font-bold"
                                    >
                                        <option value="BUY">BUY</option>
                                        <option value="SELL">SELL</option>
                                        <option value="HOLD">HOLD</option>
                                        <option value="WATCH">WATCH</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="edit_price_target">
                                        Price Target (USD)
                                    </label>
                                    <input
                                        id="edit_price_target"
                                        type="number"
                                        name="price_target"
                                        step="any"
                                        value={formData.price_target}
                                        onChange={handleFormChange}
                                        placeholder="Optional target"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.price_target ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-brand-border focus:border-neon-cyan focus:ring-neon-cyan/30'}`}
                                    />
                                    {formErrors.price_target && <p className="text-rose-455 text-xs mt-1 font-semibold">{formErrors.price_target[0]}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2" htmlFor="edit_note">
                                    Analysis / Note Details
                                </label>
                                <textarea
                                    id="edit_note"
                                    name="note"
                                    rows="4"
                                    value={formData.note}
                                    onChange={handleFormChange}
                                    placeholder="Explain your technical setup..."
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.note ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-brand-border focus:border-neon-cyan focus:ring-neon-cyan/30'}`}
                                    required
                                ></textarea>
                                {formErrors.note && <p className="text-rose-455 text-xs mt-1 font-semibold">{formErrors.note[0]}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="py-2.5 px-4 rounded-xl border border-brand-border bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalSubmitting}
                                    id="submit-edit-btn"
                                    className="py-2.5 px-4 rounded-xl font-bold text-white btn-premium shadow shadow-neon-indigo/10 hover:shadow-neon-cyan/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                                >
                                    <span>{modalSubmitting ? 'Updating...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE VERIFICATION MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
                    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-brand-border bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl animate-scale-up text-center">
                        <div className="w-12 h-12 rounded-full bg-neon-rose/10 flex items-center justify-center text-neon-rose mx-auto mb-4 border border-neon-rose/20">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <h2 className="text-lg font-extrabold font-display text-white mb-2">Delete Trade Note?</h2>
                        <p className="text-sm text-slate-400 mb-6 font-medium">
                            Are you sure you want to remove the <span className="font-extrabold text-neon-rose">{activeNote?.asset_symbol}</span> note? This action is permanent and cannot be undone.
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="py-2.5 px-4 rounded-xl border border-brand-border bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteNote}
                                disabled={modalSubmitting}
                                id="confirm-delete-btn"
                                className="py-2.5 px-4 rounded-xl bg-neon-rose hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-neon-rose/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                            >
                                <span>{modalSubmitting ? 'Deleting...' : 'Delete Note'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global toast alerts */}
            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
        </div>
    );
};

export default Dashboard;
