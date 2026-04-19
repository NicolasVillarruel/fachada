'use client';

import React, { useState, useEffect } from 'react';
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
  const isRightSide = typeof window !== 'undefined' ? position.x > window.innerWidth - 300 : false;
  const isBottomSide = typeof window !== 'undefined' ? position.y > window.innerHeight - 350 : false;
  // If we are at the bottom but also very close to the top (unlikely but possible), prefer bottom
  const shouldFlipY = isBottomSide && position.y > 400;

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {isMobile && (
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-[125]">
          <line 
            x1="50%" 
            y1="50%" 
            x2={position.x} 
            y2={position.y} 
            stroke="hsl(var(--accent))" 
            strokeWidth="2" 
            strokeDasharray="4 4"
            className="opacity-50"
          />
          <circle cx={position.x} cy={position.y} r="6" fill="hsl(var(--accent))" className="animate-ping opacity-75" />
          <circle cx={position.x} cy={position.y} r="3" fill="hsl(var(--accent))" />
        </svg>
      )}
      <div 
        className="fixed z-[130] animate-in fade-in zoom-in duration-200"
        style={isMobile ? {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        } : { 
          left: position.x, 
          top: position.y,
          transform: `translate(${isRightSide ? '-100%' : '0%'}, ${shouldFlipY ? '-100%' : '0%'})`,
          marginTop: shouldFlipY ? '-12px' : '12px',
          marginLeft: isRightSide ? '-12px' : '12px'
        }}
      >
      <div className="bg-card border border-card-border rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-3xl p-1 min-w-[240px] max-w-[280px] overflow-hidden">
        {/* Header with Tabs - Added pr-10 to avoid close button overlap */}
        <div className="flex border-b border-card-border mb-2.5 pr-10">
          <button 
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 text-[8px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'status' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-foreground'}`}
          >
            Estado
          </button>
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 text-[8px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'info' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-foreground'}`}
          >
            Info
          </button>
        </div>

        <div className="px-2 pb-3">
          {activeTab === 'status' ? (
            <div className="space-y-1">
              <div className="mb-2 px-1.5 flex justify-between items-end">
                <div>
                  <p className="text-[7px] font-black uppercase tracking-[0.2em] text-muted mb-0.5">ID Panel</p>
                  <p className="text-xs font-black font-manrope">L{module.level_number} - M{module.module_number}</p>
                </div>
                {module.display_name && <p className="text-[8px] font-bold text-accent mb-0.5">{module.display_name}</p>}
              </div>

              {[
                { id: 'PENDING', label: 'Pendiente', color: 'bg-brand-pink', textColor: 'text-brand-pink', bgColor: 'bg-brand-pink/10' },
                { id: 'IN_PROGRESS', label: 'En Ejecución', color: 'bg-amber-500', textColor: 'text-amber-500', bgColor: 'bg-amber-500/10' },
                { id: 'COMPLETED', label: 'Terminado', color: 'bg-green-500', textColor: 'text-green-500', bgColor: 'bg-green-500/10' }
              ].map((status) => (
                <button 
                  key={status.id}
                  onClick={() => onStatusChange(status.id as ModuleStatus)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    module.status === status.id ? `${status.bgColor} ${status.textColor} ring-1 ring-inset ring-white/10` : 'hover:bg-muted/5 text-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${status.color} shadow-sm`} />
                    <span>{status.label}</span>
                  </div>
                  {module.status === status.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}

              <div className="mt-4 pt-2 border-t border-card-border">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1.5 custom-scrollbar">
                <div className="space-y-0.5">
                  <label className="text-[7px] font-black uppercase tracking-widest text-muted px-1.5">Nombre / ID</label>
                  <input 
                    className="w-full bg-background/50 border border-card-border rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-accent transition-colors"
                    placeholder="Ej: P-102-A"
                    value={localData.display_name}
                    onChange={(e) => setLocalData({...localData, display_name: e.target.value})}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[7px] font-black uppercase tracking-widest text-muted px-1.5">Medidas (mm)</label>
                  <input 
                    className="w-full bg-background/50 border border-card-border rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-accent transition-colors"
                    placeholder="Ej: 1200 x 3400"
                    value={localData.dimensions}
                    onChange={(e) => setLocalData({...localData, dimensions: e.target.value})}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[7px] font-black uppercase tracking-widest text-muted px-1.5">Color</label>
                  <input 
                    className="w-full bg-background/50 border border-card-border rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-accent transition-colors"
                    placeholder="Ej: RAL 7016"
                    value={localData.color_code}
                    onChange={(e) => setLocalData({...localData, color_code: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase tracking-widest text-muted px-1.5">Plano</label>
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
                      className="w-full bg-background/50 border border-dashed border-card-border rounded-xl px-3 py-2 text-[9px] font-bold cursor-pointer hover:bg-muted/10 transition-all flex items-center justify-between group/file"
                    >
                      <span className="truncate max-w-[120px] opacity-60 group-hover:opacity-100 italic">
                        {selectedFile ? selectedFile.name : (module.blueprint_url ? 'Cambiar' : 'Subir')}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent group-hover:scale-110 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </label>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleSaveInfo}
                className="w-full py-2 bg-foreground text-background font-black text-[8px] uppercase tracking-[0.2em] rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xl"
              >
                Guardar
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-1.5 right-1.5 w-6 h-6 bg-card border border-card-border rounded-full flex items-center justify-center text-muted hover:text-foreground shadow-lg hover:rotate-90 transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    </>
  );
}
