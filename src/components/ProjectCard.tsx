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
    <div className={`bg-card border border-card-border rounded-[2.5rem] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 transform hover:-translate-y-2 group relative ${colorClass}`}>
      {/* Edit Button overlay */}
      {onEdit && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            onEdit(id);
          }}
          className="absolute top-4 right-4 z-10 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
      )}

      <Link href={`/projects/${id}`} className="block">
        <div className="h-44 w-full relative overflow-hidden">
          <img 
            src={image_url || defaultImage} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <h3 className="text-white text-xl font-bold font-manrope leading-tight line-clamp-2">
              {name}
            </h3>
          </div>
        </div>
      </Link>
      
      <div className="p-6 space-y-5">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Progreso Real</span>
            <span className="text-lg font-black font-manrope text-accent">{progress}%</span>
          </div>
          <div className="w-full bg-background border border-card-border h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-background/40 p-4 rounded-2xl border border-card-border/50">
          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-muted font-bold flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Inicio
            </p>
            <p className="text-xs font-semibold">{start_date || 'TBD'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] uppercase tracking-widest text-muted font-bold flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent underline decoration-accent/30"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Entrega
            </p>
            <p className="text-xs font-bold text-accent">{delivery_date || 'TBD'}</p>
          </div>
        </div>

        {address && (
          <div className="flex items-start gap-2 text-muted/80 text-xs px-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="truncate">{address}</span>
          </div>
        )}
      </div>
      
      <Link href={`/projects/${id}`} className="block px-6 py-4 border-t border-card-border bg-background/50 hover:bg-background/80 transition-colors">
        <div className="flex justify-between items-center group/link">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Gestión de Obra</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent group-hover/link:translate-x-1.5 transition-transform">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </div>
      </Link>
    </div>
  );
}
