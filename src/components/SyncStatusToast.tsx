import React, { useState, useEffect } from 'react';
import { GoogleSheetsService, SyncStatusEvent } from '../services/googleSheetsService';
import { Zap, CheckCircle2, AlertCircle, RefreshCw, X, FileSpreadsheet } from 'lucide-react';

interface SyncStatusToastProps {
  onOpenModal: () => void;
}

export const SyncStatusToast: React.FC<SyncStatusToastProps> = ({ onOpenModal }) => {
  const [currentEvent, setCurrentEvent] = useState<SyncStatusEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let hideTimer: any = null;

    const unsubscribe = GoogleSheetsService.subscribe((event) => {
      // Don't show toast for initial idle state
      if (event.status === 'idle') return;

      setCurrentEvent(event);
      setIsVisible(true);

      if (event.status === 'success') {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          setIsVisible(false);
        }, 3500);
      } else if (event.status === 'error') {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible || !currentEvent) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
      <div className={`p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 max-w-md ${
        currentEvent.status === 'syncing' 
          ? 'bg-slate-900/95 text-white border-slate-700 backdrop-blur-md' 
          : currentEvent.status === 'success'
          ? 'bg-emerald-900/95 text-white border-emerald-600/60 backdrop-blur-md'
          : 'bg-rose-950/95 text-white border-rose-700/60 backdrop-blur-md'
      }`}>
        <div className="shrink-0">
          {currentEvent.status === 'syncing' && (
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
          )}
          {currentEvent.status === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          {currentEvent.status === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold tracking-tight flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-emerald-300">
              <Zap className="w-3 h-3" />
              Google Sheets Realtime
            </span>
          </div>
          <p className="text-xs text-slate-200 truncate font-medium">
            {currentEvent.message}
          </p>
        </div>

        <button
          onClick={onOpenModal}
          className="text-[11px] px-2 py-1 bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white rounded-lg font-semibold transition-all shrink-0"
        >
          Detail
        </button>

        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
