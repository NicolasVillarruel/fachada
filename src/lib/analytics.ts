import { format, differenceInDays, addDays, isBefore, isAfter, startOfDay, parseISO } from 'date-fns';

export interface DailySnapshot {
  date: string;
  actual: number;
  expected: number;
}

export interface AnalyticsResult {
  timeline: DailySnapshot[];
  velocity: number; // % per day
  estimatedCompletion: Date | null;
  deviationDays: number; // + for delay, - for ahead
  currentProgress: number;
  expectedProgressToday: number;
}

export function calculateProjectAnalytics(
  project: any,
  modules: any[],
  logs: any[]
): AnalyticsResult {
  const startDate = startOfDay(parseISO(project.start_date || new Date().toISOString()));
  const deliveryDate = startOfDay(parseISO(project.delivery_date || new Date().toISOString()));
  const today = startOfDay(new Date());

  const totalModules = modules.length;
  if (totalModules === 0) {
    return {
      timeline: [],
      velocity: 0,
      estimatedCompletion: null,
      deviationDays: 0,
      currentProgress: 0,
      expectedProgressToday: 0
    };
  }

  // 1. Reconstruct History
  const timeline: DailySnapshot[] = [];
  const daysSinceStart = differenceInDays(today, startDate);
  const totalDaysPlanned = differenceInDays(deliveryDate, startDate) || 1;

  // We group logs by date for efficient lookup
  const logsByDate: Record<string, any[]> = {};
  logs.forEach(log => {
    const dateStr = format(parseISO(log.changed_at), 'yyyy-MM-dd');
    if (!logsByDate[dateStr]) logsByDate[dateStr] = [];
    logsByDate[dateStr].push(log);
  });

  // Track state of each module as we go forward in time
  const moduleStates: Record<string, string> = {};
  modules.forEach(m => {
     moduleStates[m.id] = 'PENDING';
  });

  // To properly reconstruct, we need logs sorted by time
  const sortedLogs = [...logs].sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());

  // We'll iterate from start date to today
  for (let i = 0; i <= daysSinceStart; i++) {
    const currentDate = addDays(startDate, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    // Update module states with logs from this day
    sortedLogs.forEach(log => {
      const logDate = startOfDay(parseISO(log.changed_at));
      if (format(logDate, 'yyyy-MM-dd') === dateStr) {
        moduleStates[log.module_id] = log.new_status;
      }
    });

    // Calculate progress for this day
    let actualProgress;
    
    if (i === daysSinceStart) {
      // For the current day, use the actual real-time status as the ground truth
      // to avoid discrepancies if status_logs and current module status are out of sync
      let currentWeightedSum = 0;
      modules.forEach(m => {
        if (m.status === 'COMPLETED') currentWeightedSum += 1;
        else if (m.status === 'IN_PROGRESS') currentWeightedSum += 0.5;
      });
      actualProgress = Math.round((currentWeightedSum / totalModules) * 100);
    } else {
      let weightedSum = 0;
      Object.values(moduleStates).forEach(status => {
        if (status === 'COMPLETED') weightedSum += 1;
        else if (status === 'IN_PROGRESS') weightedSum += 0.5;
      });
      actualProgress = Math.round((weightedSum / totalModules) * 100);
    }

    const expectedProgress = Math.min(100, Math.round((i / totalDaysPlanned) * 100));

    timeline.push({
      date: dateStr,
      actual: actualProgress,
      expected: expectedProgress
    });
  }

  // 2. Calculate Velocity (Progress per day)
  // We use the last 7 days or total if less
  const currentProgress = timeline.length > 0 ? timeline[timeline.length - 1].actual : 0;
  const velocity = daysSinceStart > 0 ? currentProgress / daysSinceStart : 0;

  // 3. Predictive Meta
  let estimatedCompletion = null;
  let deviationDays = 0;

  if (velocity > 0 && currentProgress < 100) {
    const remainingProgress = 100 - currentProgress;
    const remainingDays = Math.ceil(remainingProgress / velocity);
    estimatedCompletion = addDays(today, remainingDays);
    deviationDays = differenceInDays(estimatedCompletion, deliveryDate);
  }

  const expectedProgressToday = timeline.length > 0 ? timeline[timeline.length - 1].expected : 0;

  return {
    timeline,
    velocity,
    estimatedCompletion,
    deviationDays,
    currentProgress,
    expectedProgressToday
  };
}
