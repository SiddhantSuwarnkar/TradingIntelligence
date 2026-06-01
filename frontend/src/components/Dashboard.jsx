import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    Plus, Edit2, Trash2, LogOut, User, 
    TrendingUp, TrendingDown, Eye, Shield, 
    X, ChevronLeft, ChevronRight, AlertTriangle, 
    Search, RefreshCw
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
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                setToast({ message: `Updated ${data.asset_symbol} note successfully.`, type: 'success' });
                setShowEditModal(false);
                loadNotes(currentPage, searchSymbol); // Keep on current page
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
                // If we deleted the last item on the page, go back a page
                const newPage = (notes.length === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
                loadNotes(newPage, searchSymbol);
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
                    note: 'SOL is retesting the 200 EMA on the 4H chart. Accumulating for swing trade.'
                })
            });
            if (response.ok) {
                setToast({ message: 'Demo Trade Note created!', type: 'success' });
                loadNotes(1);
            } else {
                throw new Error('Failed to create demo note.');
            }
        } catch (error) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Calculate metrics based on current view/notes
    const totalSignals = count;
    const buysCount = notes.filter(n => n.action === 'BUY').length;
    const sellsCount = notes.filter(n => n.action === 'SELL').length;
    const watchesCount = notes.filter(n => n.action === 'WATCH').length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-500 flex items-center justify-center shadow shadow-cyan-500/10">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-lg font-display text-white tracking-wide">PrimeTrade<span className="text-cyan-400">.ai</span></span>
                </div>

                <div className="flex items-center gap-4">
                    {/* User Profile Info Tag */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/50">
                        {user?.role === 'admin' ? (
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                            <User className="w-3.5 h-3.5 text-violet-400" />
                        )}
                        <span className="text-xs font-semibold text-slate-350">{user?.username}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-slate-800 text-slate-400'}`}>
                            {user?.role}
                        </span>
                    </div>

                    {/* Log Out */}
                    <button
                        onClick={logout}
                        id="logout-btn"
                        className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </nav>

            {/* Dashboard Container */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
                {/* Intro & Actions Panel */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold font-display tracking-tight text-white">Watchlist & Notes</h1>
                        <p className="text-sm text-slate-400 mt-1">Manage and track trade signals and market updates.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSeedData}
                            id="demo-seed-btn"
                            className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-350 hover:text-slate-200 transition-all cursor-pointer shadow"
                            title="Add a demo note to quickly test CRUD"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Quick Demo Note</span>
                        </button>

                        <button
                            onClick={openCreateModal}
                            id="create-note-btn"
                            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-xs font-bold text-white shadow shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-white" />
                            <span>Create Note</span>
                        </button>
                    </div>
                </div>

                {/* Dashboard Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/20 backdrop-blur-md">
                        <div className="text-xs font-bold text-slate-450 uppercase tracking-wider">Total Notes</div>
                        <div className="text-3xl font-bold font-display text-white mt-2">{totalSignals}</div>
                        <div className="text-[10px] text-slate-400 mt-1.5">Across entire view</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/20 backdrop-blur-md">
                        <div className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Buy Signals</span>
                        </div>
                        <div className="text-3xl font-bold font-display text-emerald-400 mt-2">{buysCount}</div>
                        <div className="text-[10px] text-slate-400 mt-1.5">On current page</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/20 backdrop-blur-md">
                        <div className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                            <span>Sell Signals</span>
                        </div>
                        <div className="text-3xl font-bold font-display text-rose-400 mt-2">{sellsCount}</div>
                        <div className="text-[10px] text-slate-400 mt-1.5">On current page</div>
                    </div>
                    <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/20 backdrop-blur-md">
                        <div className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>Watch Items</span>
                        </div>
                        <div className="text-3xl font-bold font-display text-slate-300 mt-2">{watchesCount}</div>
                        <div className="text-[10px] text-slate-400 mt-1.5">On current page</div>
                    </div>
                </div>

                {/* Filter & Table section */}
                <div className="rounded-2xl border border-slate-900 bg-slate-900/10 backdrop-blur-xl overflow-hidden shadow-2xl">
                    {/* Search Panel */}
                    <div className="p-5 border-b border-slate-900 bg-slate-900/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="w-full sm:max-w-sm flex items-center relative">
                            <span className="absolute left-3.5 text-slate-500">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                value={searchSymbol}
                                onChange={(e) => setSearchSymbol(e.target.value)}
                                placeholder="Filter by asset symbol (e.g. BTC)..."
                                className="w-full pl-10 pr-12 py-2 border border-slate-800 bg-slate-950 text-slate-200 text-xs rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-650"
                                id="symbol-search-input"
                            />
                            {searchSymbol && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3.5 text-slate-500 hover:text-slate-350 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </form>

                        <div className="text-xs text-slate-400 font-medium">
                            {count === 0 ? 'No notes found' : `Showing ${notes.length} of ${count} notes`}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-slate-300">
                            <thead>
                                <tr className="border-b border-slate-900 bg-slate-950/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    <th className="px-6 py-4">Asset</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Price Target</th>
                                    {user?.role === 'admin' && <th className="px-6 py-4">Analyst</th>}
                                    <th className="px-6 py-4">Analysis Note</th>
                                    <th className="px-6 py-4">Date Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-900/60">
                                {loading ? (
                                    <tr>
                                        <td colSpan={user?.role === 'admin' ? 7 : 6} className="px-6 py-12 text-center text-slate-500 text-sm">
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                                                <span>Loading intelligence records...</span>
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
                                        // Standard users edit their own. Admins can view all, but edit only their own.
                                        const canModify = note.username === user?.username;

                                        let actionBadge = '';
                                        if (note.action === 'BUY') actionBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                        else if (note.action === 'SELL') actionBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                                        else if (note.action === 'HOLD') actionBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                                        else actionBadge = 'bg-slate-800 text-slate-350 border-slate-700/50';

                                        return (
                                            <tr key={note.id} className="hover:bg-slate-900/10 transition-colors text-sm group">
                                                <td className="px-6 py-4 font-bold text-white tracking-wider font-display">
                                                    {note.asset_symbol}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${actionBadge}`}>
                                                        {note.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-300">
                                                    {note.price_target ? `$${parseFloat(note.price_target).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}` : '—'}
                                                </td>
                                                {user?.role === 'admin' && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-slate-300 font-semibold">{note.username}</span>
                                                            <span className={`text-[9px] px-1 py-0.2 rounded-full uppercase ${note.user_role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                                                                {note.user_role}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-slate-350 max-w-xs md:max-w-md truncate" title={note.note}>
                                                    {note.note}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                                    {new Date(note.created_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {canModify ? (
                                                        <div className="flex items-center justify-end gap-2.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openEditModal(note)}
                                                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer"
                                                                title="Edit Note"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(note)}
                                                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                                                                title="Delete Note"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-550 italic select-none">Read-only</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-900 bg-slate-950/40 flex items-center justify-between">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1 || loading}
                                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-350 hover:text-slate-200 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Previous</span>
                            </button>
                            <span className="text-xs font-semibold text-slate-450">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages || loading}
                                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-350 hover:text-slate-200 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
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
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-40">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-850 bg-slate-900 p-6 shadow-2xl relative animate-zoom-in">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 p-1 rounded hover:bg-slate-800 text-slate-455 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold font-display text-white tracking-tight mb-5">Create Trade Note</h2>

                        <form onSubmit={handleCreateNote} className="space-y-4">
                            {/* Symbol Input */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="asset_symbol">
                                    Asset Symbol
                                </label>
                                <input
                                    id="asset_symbol"
                                    type="text"
                                    name="asset_symbol"
                                    value={formData.asset_symbol}
                                    onChange={handleFormChange}
                                    placeholder="e.g. BTC, ETH, SOL"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-600 ${formErrors.asset_symbol ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                    required
                                />
                                {formErrors.asset_symbol && <p className="text-rose-455 text-xs mt-1">{formErrors.asset_symbol[0]}</p>}
                            </div>

                            {/* Action & Price Target Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="action">
                                        Signal Action
                                    </label>
                                    <select
                                        id="action"
                                        name="action"
                                        value={formData.action}
                                        onChange={handleFormChange}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer"
                                    >
                                        <option value="BUY">BUY</option>
                                        <option value="SELL">SELL</option>
                                        <option value="HOLD">HOLD</option>
                                        <option value="WATCH">WATCH</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="price_target">
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
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.price_target ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                    />
                                    {formErrors.price_target && <p className="text-rose-455 text-xs mt-1">{formErrors.price_target[0]}</p>}
                                </div>
                            </div>

                            {/* Analysis Note Text */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="note">
                                    Analysis / Note Details
                                </label>
                                <textarea
                                    id="note"
                                    name="note"
                                    rows="4"
                                    value={formData.note}
                                    onChange={handleFormChange}
                                    placeholder="Explain your technical setup, macro logic, or indicators..."
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.note ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                    required
                                ></textarea>
                                {formErrors.note && <p className="text-rose-455 text-xs mt-1">{formErrors.note[0]}</p>}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-850">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-350 hover:text-white transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalSubmitting}
                                    id="submit-create-btn"
                                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-xs font-bold text-white shadow shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {modalSubmitting ? 'Creating...' : 'Create Note'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT TRADE NOTE MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-40">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-850 bg-slate-900 p-6 shadow-2xl relative animate-zoom-in">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute top-4 right-4 p-1 rounded hover:bg-slate-800 text-slate-455 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold font-display text-white tracking-tight mb-5">Edit Trade Note</h2>

                        <form onSubmit={handleEditNote} className="space-y-4">
                            {/* Symbol Input (ReadOnly optionally or editable) */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="edit_asset_symbol">
                                    Asset Symbol
                                </label>
                                <input
                                    id="edit_asset_symbol"
                                    type="text"
                                    name="asset_symbol"
                                    value={formData.asset_symbol}
                                    onChange={handleFormChange}
                                    placeholder="e.g. BTC, ETH, SOL"
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.asset_symbol ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                    required
                                />
                                {formErrors.asset_symbol && <p className="text-rose-455 text-xs mt-1">{formErrors.asset_symbol[0]}</p>}
                            </div>

                            {/* Action & Price Target Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="edit_action">
                                        Signal Action
                                    </label>
                                    <select
                                        id="edit_action"
                                        name="action"
                                        value={formData.action}
                                        onChange={handleFormChange}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer"
                                    >
                                        <option value="BUY">BUY</option>
                                        <option value="SELL">SELL</option>
                                        <option value="HOLD">HOLD</option>
                                        <option value="WATCH">WATCH</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="edit_price_target">
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
                                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.price_target ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                    />
                                    {formErrors.price_target && <p className="text-rose-455 text-xs mt-1">{formErrors.price_target[0]}</p>}
                                </div>
                            </div>

                            {/* Analysis Note Text */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2" htmlFor="edit_note">
                                    Analysis / Note Details
                                </label>
                                <textarea
                                    id="edit_note"
                                    name="note"
                                    rows="4"
                                    value={formData.note}
                                    onChange={handleFormChange}
                                    placeholder="Explain your technical setup..."
                                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-950 text-slate-200 text-sm focus:outline-none focus:ring-1 transition-all placeholder:text-slate-650 ${formErrors.note ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                    required
                                ></textarea>
                                {formErrors.note && <p className="text-rose-455 text-xs mt-1">{formErrors.note[0]}</p>}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-850">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-350 hover:text-white transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={modalSubmitting}
                                    id="submit-edit-btn"
                                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-xs font-bold text-white shadow shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {modalSubmitting ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE VERIFICATION MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-40">
                    <div className="w-full max-w-md rounded-2xl border border-slate-850 bg-slate-900 p-6 shadow-2xl animate-zoom-in text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <h2 className="text-lg font-bold font-display text-white mb-2">Delete Trade Note?</h2>
                        <p className="text-sm text-slate-400 mb-6">
                            Are you sure you want to remove the <span className="font-bold text-white">{activeNote?.asset_symbol}</span> note? This action is permanent and cannot be undone.
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-350 hover:text-white transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteNote}
                                disabled={modalSubmitting}
                                id="confirm-delete-btn"
                                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-650/10 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                            >
                                {modalSubmitting ? 'Deleting...' : 'Delete Note'}
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
