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
  PENDING: '#ef4444',     // Red-500
  IN_PROGRESS: '#f59e0b', // Amber-500
  COMPLETED: '#22c55e',   // Green-500
};

export default function FacadeMap({ modules, onModuleClick, levels, modulesPerLevel }: FacadeMapProps) {
  // SVG Dimensions
  const modWidth = 40;
  const modHeight = 30;
  const gap = 4;
  
  const width = modulesPerLevel * (modWidth + gap);
  const height = levels * (modHeight + gap);

  return (
    <div className="flex flex-col items-center p-8 bg-slate-900 rounded-2xl shadow-2xl glass-effect">
      <h2 className="text-2xl font-bold text-white mb-6 font-manrope">Mapa de Avance de Fachada</h2>
      <div className="overflow-auto max-w-full custom-scrollbar">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="border border-slate-700 bg-slate-800/50"
        >
          {Array.from({ length: levels }).map((_, levelIdx) => {
            const levelNum = levels - levelIdx; // Top floors first in SVG Y
            return Array.from({ length: modulesPerLevel }).map((_, modIdx) => {
              const moduleNum = modIdx + 1;
              const module = modules.find(
                (m) => m.level_number === levelNum && m.module_number === moduleNum
              );
              
              const x = modIdx * (modWidth + gap);
              const y = levelIdx * (modHeight + gap);
              const status = module?.status || 'PENDING';

              return (
                <g key={`${levelNum}-${moduleNum}`} className="group cursor-pointer" onClick={() => module && onModuleClick(module)}>
                  <rect
                    x={x}
                    y={y}
                    width={modWidth}
                    height={modHeight}
                    fill={statusColors[status]}
                    rx={2}
                    className="transition-all duration-300 group-hover:brightness-125 group-hover:stroke-white group-hover:stroke-2"
                  />
                  <text
                    x={x + modWidth / 2}
                    y={y + modHeight / 2}
                    fontSize="8"
                    fill="white"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    L{levelNum} M{moduleNum}
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex gap-6 mt-8">
        {(Object.keys(statusColors) as ModuleStatus[]).map(status => (
          <div key={status} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: statusColors[status] }} />
            <span className="text-slate-300 text-sm font-inter">
              {status === 'PENDING' ? 'Pendiente' : status === 'IN_PROGRESS' ? 'En Proceso' : 'Terminado'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
