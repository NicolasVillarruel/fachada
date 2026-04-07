'use client';

import React from 'react';

export type ModuleStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Module {
  id: string;
  level_number: number;
  module_number: number;
  status: ModuleStatus;
}

interface FacadeMapProps {
  modules: Module[];
  onModuleClick: (module: Module) => void;
  levels: number;
  modulesPerLevel: number;
}

const statusColors: Record<ModuleStatus, string> = {
  PENDING: 'var(--module-pending)',
  IN_PROGRESS: 'var(--module-progress)',
  COMPLETED: 'var(--module-completed)',
};

export default function FacadeMap({ modules, onModuleClick, levels, modulesPerLevel }: FacadeMapProps) {
  // SVG Dimensions
  const modWidth = 44;
  const modHeight = 34;
  const gap = 6;
  
  const width = modulesPerLevel * (modWidth + gap);
  const height = levels * (modHeight + gap);

  return (
    <div className="flex flex-col items-center p-4 md:p-8 bg-card border border-card-border rounded-3xl shadow-2xl overflow-hidden glass-effect">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 font-manrope text-center">
        Instalación de Paneles <span className="text-accent underline underline-offset-4 decoration-accent/20">Mapa Interactivo</span>
      </h2>
      
      <div className="overflow-auto max-w-full custom-scrollbar pb-6 w-full flex justify-start lg:justify-center">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="bg-background rounded-xl border border-card-border shadow-inner"
        >
          {/* Grid Background Lines (Optional but adds premium feel) */}
          <defs>
            <pattern id="grid" width={modWidth + gap} height={modHeight + gap} patternUnits="userSpaceOnUse">
              <rect width={modWidth + gap} height={modHeight + gap} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted/10" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {Array.from({ length: levels }).map((_, levelIdx) => {
            const levelNum = levels - levelIdx; // Top floors first in SVG Y
            return Array.from({ length: modulesPerLevel }).map((_, modIdx) => {
              const moduleNum = modIdx + 1;
              const module = modules.find(
                (m) => m.level_number === levelNum && m.module_number === moduleNum
              );
              
              const x = modIdx * (modWidth + gap) + gap / 2;
              const y = levelIdx * (modHeight + gap) + gap / 2;
              const status = module?.status || 'PENDING';

              return (
                <g 
                    key={`${levelNum}-${moduleNum}`} 
                    className="group cursor-pointer" 
                    onClick={() => module && onModuleClick(module)}
                >
                  <rect
                    x={x}
                    y={y}
                    width={modWidth}
                    height={modHeight}
                    fill={statusColors[status]}
                    rx={6}
                    stroke="white"
                    strokeWidth="1.5"
                    className="transition-all duration-300 group-hover:brightness-110 group-hover:scale-[1.02] shadow-lg group-hover:stroke-accent/50"
                  />
                  <text
                    x={x + modWidth / 2}
                    y={y + modHeight / 2}
                    fontSize="9"
                    fill="white"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity font-inter drop-shadow-md"
                  >
                    L{levelNum}M{moduleNum}
                  </text>
                  
                  {/* Subtle gloss effect on the module */}
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={modWidth - 4}
                    height={modHeight / 2}
                    fill="rgba(255,255,255,0.15)"
                    rx={4}
                    className="pointer-events-none"
                  />
                </g>
              );
            });
          })}
        </svg>
      </div>
      
      {/* Legend with modern styling */}
      <div className="flex flex-wrap justify-center gap-8 mt-4 p-4 bg-background/50 rounded-2xl border border-card-border">
        {(Object.keys(statusColors) as ModuleStatus[]).map(status => (
          <div key={status} className="flex items-center gap-3">
            <div 
                className="w-5 h-5 rounded-lg border-2 border-white shadow-md" 
                style={{ backgroundColor: statusColors[status] }} 
            />
            <span className="text-muted text-xs font-bold uppercase tracking-widest">
              {status === 'PENDING' ? 'Pendiente' : status === 'IN_PROGRESS' ? 'En Proceso' : 'Terminado'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
