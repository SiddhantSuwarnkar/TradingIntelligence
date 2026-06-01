import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    if (!message) return null;

    const themeClasses = type === 'success' 
        ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50' 
        : 'bg-rose-950/90 border-rose-500/40 text-rose-300 shadow-rose-950/50';
    
    const Icon = type === 'success' ? CheckCircle : AlertCircle;

    return (
        <div className={`fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 animate-slide-up z-50 ${themeClasses}`}>
            <Icon className="w-5 h-5 shrink-0 animate-pulse" />
            <span className="text-sm font-medium font-sans">{message}</span>
            <button 
                onClick={onClose} 
                className="ml-2 p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                id="close-toast-btn"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
