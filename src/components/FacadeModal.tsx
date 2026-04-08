'use client';

import React, { useState, useEffect } from 'react';

interface FacadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (facade: any) => void;
  initialData?: any;
}

export default function FacadeModal({ isOpen, onClose, onSave, initialData }: FacadeModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    level_count: 5,
    modules_per_level: 10,
    elevation_url: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        level_count: initialData.level_count || 10,
        modules_per_level: initialData.modules_per_level || 15,
        elevation_url: initialData.elevation_url || '',
      });
      setPreviewUrl(initialData.elevation_url || null);
    } else {
      setFormData({
        name: '',
        level_count: 5,
        modules_per_level: 10,
        elevation_url: '',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [initialData, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFormData({ ...formData, elevation_url: '' }); // Clear URL if file is selected
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, file: selectedFile });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-card border border-card-border w-full max-w-2xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-card-border flex justify-between items-center bg-background/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20 shadow-inner">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
            </div>
            <h2 className="text-2xl font-black font-manrope tracking-tight leading-none">
              {initialData ? 'Editar Frente' : 'Configurar Frente'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3">Nombre del Frente</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-bold placeholder:opacity-30"
                  placeholder="Ej: Fachada Este"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted">Niveles</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.level_count}
                    onChange={(e) => setFormData({ ...formData, level_count: parseInt(e.target.value) })}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-black text-center"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted">Mod. Ref</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.modules_per_level}
                    onChange={(e) => setFormData({ ...formData, modules_per_level: parseInt(e.target.value) })}
                    className="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-black text-center"
                  />
                </div>
              </div>

              <div className="bg-accent/5 p-4 rounded-2xl border border-accent/20">
                <p className="text-[9px] font-black uppercase tracking-widest text-accent/60 mb-2">Ayuda Visual</p>
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                  Dada la naturaleza irregular de los proyectos, puedes establecer una malla de referencia ahora, pero la identificación final se hará **manualmente sobre el plano**.
                </p>
              </div>
            </div>

            {/* Right Column: Elevation Image */}
            <div className="space-y-6">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted">Plano de Elevación</label>
              
              <div className="relative aspect-video bg-background border-2 border-dashed border-card-border rounded-3xl overflow-hidden group cursor-pointer hover:border-accent transition-all">
                {previewUrl ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(null);
                          setSelectedFile(null);
                          setFormData({...formData, elevation_url: ''});
                        }}
                        className="p-3 bg-red-500 text-white rounded-full shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-[10px] uppercase tracking-widest">Subir Plano Local</p>
                      <p className="text-[9px] text-muted font-bold mt-1">PNG, JPG hasta 5MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted">O pegar URL externa</p>
                <input
                  type="url"
                  value={formData.elevation_url}
                  onChange={(e) => {
                    setFormData({ ...formData, elevation_url: e.target.value });
                    setPreviewUrl(e.target.value || null);
                    setSelectedFile(null);
                  }}
                  className="w-full bg-background border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium text-xs"
                  placeholder="https://servidor.com/plano.jpg"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-card-border flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-5 rounded-2xl border border-card-border font-black text-[10px] uppercase tracking-widest hover:bg-muted/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] px-8 py-5 rounded-2xl bg-foreground text-background font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 shadow-xl transition-all"
            >
              {initialData ? 'Actualizar Proyecto' : 'Finalizar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
