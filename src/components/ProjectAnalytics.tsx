'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectAnalyticsProps {
  data: any;
}

export default function ProjectAnalytics({ data }: ProjectAnalyticsProps) {
  if (!data) return null;
  const { timeline, velocity, estimatedCompletion, deviationDays, currentProgress, expectedProgressToday } = data;

  if (!timeline || timeline.length === 0) return null;

  const isDelayed = deviationDays > 0;
  const absDeviation = Math.abs(deviationDays);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 1. Chart Section - 75% width on large screens */}
        <div className="lg:col-span-3 bg-card border border-card-border rounded-[2rem] p-6 shadow-2xl overflow-hidden group h-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div className="space-y-0.5">
              <h3 className="text-xl font-black font-manrope tracking-tight">Evolución del Proyecto</h3>
              <p className="text-muted text-[11px] font-medium">Sincronización histórica de avances acumulados.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-brand-blue" />
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Real</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-[#d52974]" />
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Plan</span>
              </div>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-blue)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--brand-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    try {
                      return format(parseISO(date.toString()), 'dd MMM', { locale: es });
                    } catch (e) {
                      return date;
                    }
                  }}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-muted)' }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-muted)' }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card/90 backdrop-blur-md border border-card-border p-4 rounded-2xl shadow-2xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">
                            {label ? format(parseISO(label.toString()), 'EEEE, dd MMMM', { locale: es }) : ''}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-brand-blue flex justify-between gap-4">
                              <span>Avance Real:</span>
                              <span>{payload[0].value}%</span>
                            </p>
                            <p className="text-sm font-black text-[#d52974] flex justify-between gap-4">
                              <span>Planificado:</span>
                              <span>{payload[1].value}%</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="var(--brand-blue)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorActual)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="expected" 
                  stroke="#d52974" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. KPIs Section - 25% width stacked on the right */}
        <div className="flex flex-col gap-4 h-full">
          {/* Status indicator */}
          <div className={`p-3 rounded-2xl border shadow-lg backdrop-blur-xl flex flex-col justify-between flex-1 transition-all ${
            isDelayed ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'
          }`}>
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-1.5">
                 <div className={`p-1 rounded-lg ${isDelayed ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                 </div>
                 <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Estado Tiempo</span>
               </div>
               <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-lg ${isDelayed ? 'bg-red-500 shadow-red-500/50' : 'bg-green-500 shadow-green-500/50'}`} />
            </div>
            <div>
              <h4 className={`text-base font-black font-manrope leading-tight ${isDelayed ? 'text-red-500' : 'text-green-500'}`}>
                {absDeviation === 0 ? 'En Tiempo' : `${absDeviation}d ${isDelayed ? 'Atrás' : 'Adel.'}`}
              </h4>
            </div>
          </div>

          {/* Velocity */}
          <div className="p-3 rounded-2xl bg-brand-blue/5 border border-brand-blue/20 shadow-lg backdrop-blur-xl flex flex-col justify-between flex-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-lg bg-brand-blue/10 text-brand-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60 text-brand-blue">Velocidad</span>
            </div>
            <div>
              <h4 className="text-base font-black font-manrope text-brand-blue leading-tight">
                {velocity.toFixed(1)}% <span className="text-[9px] opacity-60 text-foreground">/ día</span>
              </h4>
            </div>
          </div>

          {/* Estimated End */}
          <div className="p-3 rounded-2xl bg-brand-purple/5 border border-brand-purple/20 shadow-lg backdrop-blur-xl flex flex-col justify-between flex-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-lg bg-brand-purple/10 text-brand-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60 text-brand-purple">Proyección</span>
            </div>
            <div>
              <h4 className="text-base font-black font-manrope text-brand-purple leading-tight">
                {estimatedCompletion ? format(estimatedCompletion, 'dd MMM yy', { locale: es }) : 'TBD'}
              </h4>
            </div>
          </div>

          {/* Breach */}
          <div className="p-3 rounded-2xl bg-card border border-card-border shadow-lg backdrop-blur-xl flex flex-col justify-between flex-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-lg bg-muted/10 text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V4"/><path d="m5 11 7-7 7 7"/></svg>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60 text-muted">Diferencia</span>
            </div>
            <div>
               <h4 className={`text-base font-black font-manrope leading-tight ${currentProgress >= expectedProgressToday ? 'text-green-500' : 'text-accent'}`}>
                 {currentProgress >= expectedProgressToday ? '+' : ''}{currentProgress - expectedProgressToday}%
               </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
