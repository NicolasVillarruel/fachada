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
}

export default function ProjectCard({ id, name, address, start_date, delivery_date, image_url }: ProjectCardProps) {
  const defaultImage = "https://images.unsplash.com/photo-1486406146926-c627a92fb1ab?q=80&w=2070&auto=format&fit=crop";

  return (
    <Link href={`/projects/${id}`} className="block group">
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
        <div className="h-48 w-full relative overflow-hidden">
          <img 
            src={image_url || defaultImage} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <h3 className="text-white text-xl font-bold font-manrope">{name}</h3>
          </div>
        </div>
        
        <div className="p-5 space-y-3">
          {address && (
            <div className="flex items-start gap-2 text-muted text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{address}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Inicio</p>
              <p className="text-sm font-medium">{start_date || 'TBD'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">Entrega</p>
              <p className="text-sm font-medium text-accent">{delivery_date || 'TBD'}</p>
            </div>
          </div>
        </div>
        
        <div className="px-5 py-3 border-t border-card-border bg-background/50 flex justify-between items-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">Gestión de Obra</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent group-hover:translate-x-1 transition-transform">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}
