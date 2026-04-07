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
  const { timeline, velocity, estimatedCompletion, deviationDays, currentProgress, expectedProgressToday } = data;

  if (!timeline || timeline.length === 0) return null;

  const isDelayed = deviationDays > 0;
  const absDeviation = Math.abs(deviationDays);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status indicator */}
        <div className={`p-6 rounded-3xl border-2 shadow-xl backdrop-blur-xl flex flex-col justify-between h-40 transition-all ${
          isDelayed ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'
        }`}>
          <div className="flex justify-between items-start">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Estado de Tiempo</span>
             <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${isDelayed ? 'bg-red-500 shadow-red-500/50' : 'bg-green-500 shadow-green-500/50'}`} />
          </div>
          <div>
            <h4 className={`text-2xl font-black font-manrope ${isDelayed ? 'text-red-500' : 'text-green-500'}`}>
              {absDeviation === 0 ? 'En Cronograma' : `${absDeviation} días de ${isDelayed ? 'Retraso' : 'Adelanto'}`}
            </h4>
            <p className="text-[10px] font-bold opacity-40 mt-1">Comparado con fecha de entrega</p>
          </div>
        </div>

        {/* Velocity */}
        <div className="p-6 rounded-3xl bg-brand-blue/5 border-2 border-brand-blue/20 shadow-xl backdrop-blur-xl flex flex-col justify-between h-40">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-brand-blue">Velocidad</span>
          <div>
            <h4 className="text-3xl font-black font-manrope text-brand-blue">
              {velocity.toFixed(1)}% <span className="text-sm opacity-60 text-foreground">/ día</span>
            </h4>
            <p className="text-[10px] font-bold opacity-40 mt-1">Ritmo de instalación ponderado</p>
          </div>
        </div>

        {/* Estimated End */}
        <div className="p-6 rounded-3xl bg-brand-purple/5 border-2 border-brand-purple/20 shadow-xl backdrop-blur-xl flex flex-col justify-between h-40">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-brand-purple">Proyección</span>
          <div>
            <h4 className="text-2xl font-black font-manrope text-brand-purple">
              {estimatedCompletion ? format(estimatedCompletion, 'dd MMM yyyy', { locale: es }) : 'Calculando...'}
            </h4>
            <p className="text-[10px] font-bold opacity-40 mt-1">Cierre estimado según ritmo</p>
          </div>
        </div>

        {/* Breach */}
        <div className="p-6 rounded-3xl bg-card border-2 border-card-border shadow-xl backdrop-blur-xl flex flex-col justify-between h-40">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-muted">Diferencia</span>
          <div>
             <h4 className={`text-3xl font-black font-manrope ${currentProgress >= expectedProgressToday ? 'text-green-500' : 'text-amber-500'}`}>
               {currentProgress - expectedProgressToday}%
             </h4>
             <p className="text-[10px] font-bold opacity-40 mt-1">Avance Real vs. Planificado</p>
          </div>
        </div>
      </div>

      {/* 2. Chart Section */}
      <div className="bg-card border border-card-border rounded-[3rem] p-8 shadow-2xl overflow-hidden group">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-black font-manrope tracking-tight">Evolución del Proyecto</h3>
            <p className="text-muted text-sm font-medium">Sincronización histórica de avances acumulados.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-brand-blue" />
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Real</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-card-border border-2 border-brand-blue/30" />
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Plan</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
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
                          <p className="text-sm font-black text-muted flex justify-between gap-4">
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
                stroke="var(--card-border)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
