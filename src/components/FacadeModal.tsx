'use client';

import React, { useState, useEffect } from 'react';

interface FacadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (facade: any) => void;
  initialData?: any;
}

export default function FacadeModal({ isOpen, onClose, onSave, initialData }: FacadeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    level_count: 10,
    modules_per_level: 15,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        level_count: initialData.level_count || 10,
        modules_per_level: initialData.modules_per_level || 15,
      });
    } else {
      setFormData({
        name: '',
        level_count: 10,
        modules_per_level: 15,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-card border border-card-border w-full max-w-lg rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-card-border flex justify-between items-center bg-background/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20 shadow-inner">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
            </div>
            <h2 className="text-2xl font-black font-manrope tracking-tight leading-none">{initialData ? 'Editar Frente' : 'Nuevo Frente'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3">Identificación de la Fachada</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-background border border-card-border rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold placeholder:opacity-30"
              placeholder="Ej: Fachada Principal / Norte"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted">Niveles de Obra</label>
              <div className="relative">
                 <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.level_count}
                    onChange={(e) => setFormData({ ...formData, level_count: parseInt(e.target.value) })}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-manrope text-center font-black text-2xl"
                  />
                  <div className="absolute top-0 bottom-0 left-4 flex items-center pointer-events-none opacity-20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4c0-.5.5-1 1-1h14c.5 0 1 .5 1 1v18"/><path d="M12 18h.01"/><path d="M16 18h.01"/><path d="M8 18h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 14h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M8 10h.01"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/></svg>
                  </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted">Módulos x Nivel</label>
              <div className="relative">
                 <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.modules_per_level}
                    onChange={(e) => setFormData({ ...formData, modules_per_level: parseInt(e.target.value) })}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-manrope text-center font-black text-2xl"
                  />
                  <div className="absolute top-0 bottom-0 left-4 flex items-center pointer-events-none opacity-20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M3 7h18"/><path d="M3 14h18"/><path d="M7 21V7"/><path d="M12 21V7"/><path d="M17 21V7"/></svg>
                  </div>
              </div>
            </div>
          </div>
          
          <div className="bg-accent/5 p-6 rounded-[2rem] border border-accent/20 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 17 5 5"/><path d="m7 7-5-5"/><path d="m22 2-5 5"/><path d="m2 22 5-5"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-0.5 opacity-60">Malla Total</p>
              <p className="text-lg font-black text-accent">
                <span className="underline underline-offset-4">{(formData.level_count || 0) * (formData.modules_per_level || 0)}</span> Unidades Técnicas
              </p>
            </div>
          </div>
          
          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-xl border border-card-border font-black text-[10px] uppercase tracking-widest hover:bg-muted/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] px-8 py-4 rounded-xl bg-foreground text-background font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 shadow-xl transition-all"
            >
              {initialData ? 'Actualizar Parametrización' : 'Lanzar Parametrización'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
