'use client';

import React from 'react';
import { ModuleStatus } from './FacadeMap';

interface ModuleActionsMenuProps {
  module: any;
  onStatusChange: (status: ModuleStatus) => void;
  onDelete: () => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export default function ModuleActionsMenu({ module, onStatusChange, onDelete, onClose, position }: ModuleActionsMenuProps) {
  return (
    <div 
      className="fixed z-[100] animate-in fade-in zoom-in duration-200"
      style={{ left: position.x, top: position.y }}
    >
      <div className="bg-card border border-card-border rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] backdrop-blur-xl p-2 min-w-[180px]">
        <div className="px-3 py-2 border-b border-card-border mb-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted">Panel Selección</p>
          <p className="text-sm font-black font-manrope">Nivel {module.level_number} - Mod {module.module_number}</p>
        </div>

        <div className="space-y-1">
          <button 
            onClick={() => onStatusChange('PENDING')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              module.status === 'PENDING' ? 'bg-brand-pink/10 text-brand-pink' : 'hover:bg-muted/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-pink" />
              <span>Pendiente</span>
            </div>
            {module.status === 'PENDING' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </button>

          <button 
            onClick={() => onStatusChange('IN_PROGRESS')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              module.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-500' : 'hover:bg-muted/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>En Ejecución</span>
            </div>
            {module.status === 'IN_PROGRESS' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </button>

          <button 
            onClick={() => onStatusChange('COMPLETED')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              module.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'hover:bg-muted/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Terminado</span>
            </div>
            {module.status === 'COMPLETED' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </button>
        </div>

        <div className="mt-2 pt-2 border-t border-card-border">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            <span>Eliminar Módulo</span>
          </button>
        </div>

        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 w-6 h-6 bg-card border border-card-border rounded-full flex items-center justify-center text-muted hover:text-foreground shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
