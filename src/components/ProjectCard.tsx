'use client';

import React from 'react';
import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  name: string;
  address?: string;
  start_date?: string;
  delivery_date?: string;
  image_url?: string;
  progress?: number;
  onEdit?: (id: string) => void;
  index?: number;
}

export default function ProjectCard({ id, name, address, start_date, delivery_date, image_url, progress = 0, onEdit, index = 0 }: ProjectCardProps) {
  const colors = ['purple', 'blue', 'green', 'yellow', 'pink', 'orange'];
  const colorClass = `card-accent-${colors[index % colors.length]}`;
  const defaultImage = "https://images.unsplash.com/photo-1486406146926-c627a92fb1ab?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className={`bg-card border border-card-border rounded-[1.5rem] overflow-hidden hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)] transition-all duration-500 transform hover:-translate-y-1.5 group relative ${colorClass}`}>
      {/* Edit Button overlay - High Contrast */}
      {onEdit && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            onEdit(id);
          }}
          className="absolute top-3 right-3 z-10 p-2.5 bg-brand-blue text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
          title="Editar Proyecto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
      )}

      <Link href={`/projects/${id}`} className="block">
        <div className="h-36 w-full relative overflow-hidden">
          <img 
            src={image_url || defaultImage} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-5 right-5">
            <h3 className="text-white text-lg font-bold font-manrope leading-tight line-clamp-2">
              {name}
            </h3>
          </div>
        </div>
      </Link>
      
      <div className="p-5 space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted">Progreso Real</span>
            <span className="text-base font-black font-manrope text-accent">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 border border-card-border h-2 rounded-full overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-100/50 dark:bg-white/5 p-3 rounded-xl border border-card-border/50">
          <div className="space-y-0.5">
            <p className="text-[8px] uppercase tracking-widest text-muted font-black flex items-center gap-1">
              Inicio
            </p>
            <p className="text-[10px] font-bold text-foreground/90">{start_date || 'TBD'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] uppercase tracking-widest text-muted font-black flex items-center gap-1">
              Entrega
            </p>
            <p className="text-[10px] font-bold text-accent">{delivery_date || 'TBD'}</p>
          </div>
        </div>

        {address && (
          <div className="flex items-start gap-1.5 text-muted/80 text-[10px] px-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 opacity-50"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="truncate font-medium">{address}</span>
          </div>
        )}
      </div>
      
      <Link href={`/projects/${id}`} className="block px-5 py-3.5 border-t border-card-border bg-slate-100/30 dark:bg-white/5 hover:bg-brand-blue/10 dark:hover:bg-brand-blue/20 transition-all group/link">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.1em] text-foreground/80 group-hover/link:text-brand-blue transition-colors">Gestión de Obra</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent group-hover/link:translate-x-1.5 transition-transform">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </div>
      </Link>
    </div>
  );
}
