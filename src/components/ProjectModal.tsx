'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: any, imageFile?: File | null) => void;
  initialData?: any;
}

export default function ProjectModal({ isOpen, onClose, onSave, initialData }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    start_date: '',
    delivery_date: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        start_date: initialData.start_date || '',
        delivery_date: initialData.delivery_date || '',
        image_url: initialData.image_url || '',
      });
      setPreviewUrl(initialData.image_url || null);
    } else {
      setFormData({
        name: '',
        address: '',
        start_date: '',
        delivery_date: '',
        image_url: '',
      });
      setPreviewUrl(null);
    }
    setImageFile(null);
  }, [initialData, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData, imageFile);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-card-border animate-in fade-in zoom-in duration-300">
        <header className="px-5 py-4 border-b border-card-border flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <h2 className="text-lg font-bold font-manrope">{initialData ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-card-border hover:text-foreground text-muted rounded-full transition-all duration-300 hover:rotate-90 active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="shrink-0">
               <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-card-border overflow-hidden relative group bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-3.5">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1.5">Nombre del Proyecto</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-background/50 border border-card-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent transition-all font-medium text-sm"
                  placeholder="Ej: Edificio Nicomax"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-muted">Dirección</label>
                  {formData.address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[8px] font-bold text-accent hover:underline flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      VER MAPA
                    </a>
                  )}
                </div>
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-3 text-muted"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-background/50 border border-card-border rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent transition-all font-medium text-sm"
                    placeholder="Calle Principal 123"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1.5">Fecha Inicio</label>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-3 text-muted"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full bg-background/50 border border-card-border rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent transition-all font-inter text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1.5">Fecha Entrega</label>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-3 text-accent"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="w-full bg-background/50 border border-card-border rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent transition-all font-inter text-sm text-accent font-bold"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-card-border font-black hover:bg-muted/10 transition-colors uppercase tracking-widest text-[9px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-4 py-3 rounded-xl bg-brand-blue text-white font-black hover:brightness-110 shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[9px]"
            >
              {loading ? (
                <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>
                  {initialData ? 'Guardar' : 'Crear'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
