'use client';

import React, { useState } from 'react';
import { Module, ModuleStatus } from './FacadeMap';

interface ModuleActionsMenuProps {
  module: Module;
  onStatusChange: (status: ModuleStatus) => void;
  onUpdateMetadata: (metadata: Partial<Module>, file?: File) => void;
  onDelete: () => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export default function ModuleActionsMenu({ 
  module, 
  onStatusChange, 
  onUpdateMetadata,
  onDelete, 
  onClose, 
  position 
}: ModuleActionsMenuProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'info'>('status');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localData, setLocalData] = useState({
    display_name: module.display_name || '',
    dimensions: module.dimensions || '',
    color_code: module.color_code || '',
    blueprint_url: module.blueprint_url || '',
  });

  const handleSaveInfo = () => {
    onUpdateMetadata(localData, selectedFile || undefined);
  };

  // Smart positioning logic: flip the menu if too close to edges
  const isRightSide = typeof window !== 'undefined' ? position.x > window.innerWidth - 350 : false;
  const isBottomSide = typeof window !== 'undefined' ? position.y > window.innerHeight - 450 : false;

  return (
    <div 
      className="fixed z-[120] animate-in fade-in zoom-in duration-200"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: `translate(${isRightSide ? '-100%' : '0%'}, ${isBottomSide ? '-100%' : '0%'})`,
        marginTop: isBottomSide ? '-10px' : '10px',
        marginLeft: isRightSide ? '-10px' : '10px'
      }}
    >
      <div className="bg-card border border-card-border rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-3xl p-1.5 min-w-[240px] max-w-[280px] overflow-hidden">
        {/* Header with Tabs */}
        <div className="flex border-b border-card-border mb-2.5">
          <button 
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'status' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-foreground'}`}
          >
            Estados
          </button>
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-foreground'}`}
          >
            Información
          </button>
        </div>

        <div className="px-2 pb-3">
          {activeTab === 'status' ? (
            <div className="space-y-1">
              <div className="mb-2.5 px-1.5">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-muted mb-0.5">Identificador</p>
                <p className="text-xs font-black font-manrope">L{module.level_number} - M{module.module_number}</p>
                {module.display_name && <p className="text-[9px] font-bold text-accent mt-0.5 leading-tight">{module.display_name}</p>}
              </div>

              {[
                { id: 'PENDING', label: 'Pendiente', color: 'bg-brand-pink', textColor: 'text-brand-pink', bgColor: 'bg-brand-pink/10' },
                { id: 'IN_PROGRESS', label: 'En Ejecución', color: 'bg-amber-500', textColor: 'text-amber-500', bgColor: 'bg-amber-500/10' },
                { id: 'COMPLETED', label: 'Terminado', color: 'bg-green-500', textColor: 'text-green-500', bgColor: 'bg-green-500/10' }
              ].map((status) => (
                <button 
                  key={status.id}
                  onClick={() => onStatusChange(status.id as ModuleStatus)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    module.status === status.id ? `${status.bgColor} ${status.textColor} ring-1 ring-inset ring-white/10` : 'hover:bg-muted/5 text-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${status.color} shadow-sm`} />
                    <span>{status.label}</span>
                  </div>
                  {module.status === status.id && (
                    <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </button>
              ))}

              <div className="mt-4 pt-3 border-t border-card-border">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  <span>Eliminar Módulo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted px-1.5">Nombre / ID Panel</label>
                  <input 
                    className="w-full bg-background/50 border border-card-border rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-accent transition-colors"
                    placeholder="Ej: P-102-A"
                    value={localData.display_name}
                    onChange={(e) => setLocalData({...localData, display_name: e.target.value})}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted px-1.5">Medidas (mm)</label>
                  <input 
                    className="w-full bg-background/50 border border-card-border rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-accent transition-colors"
                    placeholder="Ej: 1200 x 3400"
                    value={localData.dimensions}
                    onChange={(e) => setLocalData({...localData, dimensions: e.target.value})}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted px-1.5">Color / Acabado</label>
                  <input 
                    className="w-full bg-background/50 border border-card-border rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-accent transition-colors"
                    placeholder="Ej: RAL 7016"
                    value={localData.color_code}
                    onChange={(e) => setLocalData({...localData, color_code: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-widest text-muted px-1.5">Plano del Módulo</label>
                  <div className="relative">
                    <input 
                      type="file"
                      id="module-file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      accept=".pdf,image/*"
                    />
                    <label 
                      htmlFor="module-file"
                      className="w-full bg-background/50 border border-dashed border-card-border rounded-xl px-3 py-2.5 text-[10px] font-bold cursor-pointer hover:bg-muted/10 transition-all flex items-center justify-between group/file"
                    >
                      <span className="truncate max-w-[130px] opacity-60 group-hover:opacity-100 italic">
                        {selectedFile ? selectedFile.name : (module.blueprint_url ? 'Cambiar Plano' : 'Seleccionar Archivo')}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent group-hover:scale-110 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </label>
                  </div>
                  {module.blueprint_url && !selectedFile && (
                    <a 
                      href={module.blueprint_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block px-1.5 text-[7px] font-black text-accent hover:underline uppercase tracking-widest"
                    >
                      Ver Archivo Actual
                    </a>
                  )}
                </div>
              </div>
              
              <button 
                onClick={handleSaveInfo}
                className="w-full py-2.5 bg-foreground text-background font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xl"
              >
                Guardar Cambios
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 bg-card border border-card-border rounded-full flex items-center justify-center text-muted hover:text-foreground shadow-lg hover:rotate-90 transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
