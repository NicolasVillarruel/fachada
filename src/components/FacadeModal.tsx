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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-card-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-card-border flex justify-between items-center bg-background/50">
          <h2 className="text-xl font-bold font-manrope">{initialData ? 'Editar Fachada' : 'Nueva Fachada'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Nombre de la Fachada</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="Ej: Fachada Principal (Norte)"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Cantidad de Niveles</label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.level_count}
                onChange={(e) => setFormData({ ...formData, level_count: parseInt(e.target.value) })}
                className="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-inter text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Módulos por Nivel</label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.modules_per_level}
                onChange={(e) => setFormData({ ...formData, modules_per_level: parseInt(e.target.value) })}
                className="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-inter text-center font-bold"
              />
            </div>
          </div>
          
          <div className="bg-accent/5 p-4 rounded-2xl border border-accent/20">
            <p className="text-sm text-center text-accent">
              Se generarán un total de <span className="font-bold underline">{(formData.level_count || 0) * (formData.modules_per_level || 0)}</span> módulos interactivos para esta fachada.
            </p>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-card-border font-bold hover:bg-muted/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-accent text-white font-bold hover:brightness-110 shadow-lg shadow-accent/20 transition-all"
            >
              {initialData ? 'Guardar Cambios' : 'Crear Fachada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
